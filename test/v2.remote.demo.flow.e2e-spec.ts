import request from 'supertest';
import { jest } from '@jest/globals';
import { inspect } from 'util';
import { delayFunc } from './util/time.util';
import getAuth0Token from './util/auth0.token.util';

jest.setTimeout(60000);

/**
 * The demo test is a very specific test to make sure the pieces for the demo work. We may end up removing this is the future in favor of
 * more general tests but for now we need just need something that can be run against our remote envs to ensure they are configured correctly
 *
 * These tests are designed to be run after the following steps:
 *   docker-compose -f docker-compose.demo.yml up -d
 *   docker exec -it kiva-controller node /www/dist/implementations/sl/kiva/scripts/setup.sl.kiva.js
 *   docker exec -it demo-controller node /www/dist/implementations/demo/scripts/setup.demo.js
 * Or alternatively to be run against a deployed k8s env
 */
describe('Full system eKYC integration tests for demo issue and verify flows', () => {
    let invitation: any;
    let demoConnectionId: string;
    let auth0Token: string;
    let presExId: string;

    const AUTH0_HEADER = 'Authorization';

    it('Get Auth0 access token', () => {

        return getAuth0Token()
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

    it('Start connection to demo agent', () => {
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/demo/api/connection')
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
                expect(res.body.connection_id).toBeDefined();
                demoConnectionId = res.body.connection_id;
            });
    });

    // Note we're using the kiva agent to simulate a mobile agent, since an actual mobile agent isn't available for this test
    it('Mobile (aka Kiva) agent receives demo connection invite', async () => {
        await delayFunc(5000);
        const data = {
            invitation,
            alias: 'demo-connection'
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/agent/accept-connection')
            .set(AUTH0_HEADER, auth0Token)
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
            });
    });

    it('Check connection', async () => {
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/demo/api/connection/${demoConnectionId}`)
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('response');
            });
    });

    it('Issue credential for mobile', async () => {
        await delayFunc(5000);
        const issueData: any = {
            entityData: {
                nationalId: 'ABC123',
                firstName: 'First',
                lastName: 'Last',
                birthDate: '1975-10-10 00:00:00',
                'photo~attach':
                    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
            },
            connectionId: demoConnectionId,
            profile: 'demo.cred.def.json'
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/demo/api/issue')
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .send(issueData)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('offer_sent');
                    expect(res.body.credential_exchange_id).toBeDefined();
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });

    it('Initiate verify request', async () => {
        await delayFunc(5000);
        const data = {
            connectionId: demoConnectionId,
            profile: 'demo.proof.request.json',
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/demo/api/verify')
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
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
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/demo/api/verify/${presExId}`)
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });


    it('Check connection', async () => {
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .get(`/v2/demo/api/connection/${demoConnectionId}`)
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('active');
            });
    });

    it('Delete connection', async () => {
        await delayFunc(5000);
        return request(process.env.API_GATEWAY_URL)
            .delete(`/v2/demo/api/connection/${demoConnectionId}`)
            .set(AUTH0_HEADER, auth0Token)
            .set('agent', 'demo-agent')
            .expect(200);
    });
});
