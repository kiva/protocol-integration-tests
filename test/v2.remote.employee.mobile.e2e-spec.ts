import request from 'supertest';
import { inspect } from 'util';
import { delayFunc } from './util/time.util';

jest.setTimeout(60000);

/**
 * Test the issuing and verifying of employee credentials for mobile
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 */
describe('Full system issue and verify flows for employee credentials', () => {
    let invitation: any;
    let kivaConnectionId: string;
    let credentialExchangeId: string;
    let presExId: string;
    let auth0Token: string;

    it('Get Auth0 access token', () => {
        const auth0Data = {
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            grant_type: 'client_credentials',
        };

        return request(`https://${process.env.AUTH0_DOMAIN}`)
            .post('/oauth/token')
            .set('content-type', 'application/json')
            .send(auth0Data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                    expect(res.body.access_token).toBeDefined();
                    auth0Token = `Bearer ${res.body.access_token as string}`;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Start demo connection to kiva agent', () => {
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/connection')
            .set('Authorization', auth0Token)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
                kivaConnectionId = res.body.connection_id;
                invitation = res.body.invitation;
            });
    });

    // Requires demo agent controls to be exposed via the gateway
    it('Demo agent receives kiva connection invite', async () => {
        await delayFunc(5000);
        const data = {
            invitation,
            alias: 'demo-connection'
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/demo/agent/accept-connection')
            .set('Authorization', auth0Token)
            .set('agent', 'demo-agent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
            });
    });

    it('Check demo connection', async () => {
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/kiva/api/connection/${kivaConnectionId}`)
            .set('Authorization', auth0Token)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('response');
            });
    });

    it('Issue employee credential for mobile', async () => {
        await delayFunc(5000);
        const data: any = {
            profile: 'employee.cred.def.json',
            connectionId: kivaConnectionId,
            entityData : {
                firstName: 'First',
                lastName: 'Last',
                companyEmail: 'company@email.com',
                currentTitle: 'Engineer',
                team: 'Engineering',
                hireDate: '2015-01-30', // Aries suggests ISO 8601 format (yyyy-mm-dd) for dates
                officeLocation: 'Cloud',
                'photo~attach':
                    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
                type: 'Intern',
                endDate: '1605043300' // Unix time for predicate comparisons
            }
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/issue')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('offer_sent');
                    expect(res.body.credential_exchange_id).toBeDefined();
                    credentialExchangeId = res.body.credential_exchange_id;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Initiate verify request', async () => {
        await delayFunc(5000);
        const data = {
            profile: 'employee.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/verify')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Check presentation', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/kiva/api/verify/${presExId}`)
            .set('Authorization', auth0Token)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.verified).toBe('true');
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });

    it('Revoke Issued credential', async () => {
        await delayFunc(1000);
        const data = {
            credentialExchangeId,
            publish: true,
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/revoke')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Initiate verify request', async () => {
        await delayFunc(5000);
        const data = {
            profile: 'employee.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/verify')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Check presentation', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/kiva/api/verify/${presExId}`)
            .set('Authorization', auth0Token)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.verified).toBe('false');
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });

    it('Delete credential for issuer', async () => {
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .delete(`/v2/kiva/api/issuer/records/${credentialExchangeId}`)
            .set('Authorization', auth0Token)
            .expect(200);
    });
});
