import request from 'supertest';
import { inspect } from 'util';

/**
 * Test the issuing and verifying of employee credentials for guardianship
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 */
describe('Full system issue and verify flows for employee credentials', () => {
    let email: string;
    let auth0Token: string;
    const phoneNumber = '+16282185460'; // Fake US number that passes twilio's checks

    const delayFunc = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    beforeAll(() => {
        // We use email as the employees unique identifier so needs to be unique
        const id = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        email = `company${id}@email.com`;
        jest.setTimeout(60000);
    });

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
                    auth0Token = 'Bearer ' + res.body.access_token;
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Onboard employee and issue credential', async () => {
        await delayFunc(5000);
        const data: any = {
            profile: 'employee.cred.def.json',
            guardianData: [{
                pluginType: 'SMS_OTP',
                filters: {
                    externalIds: {
                        company_email: email
                    },
                },
                params: {
                    phoneNumber
                },

            }],
            entityData : {
                firstName: 'First',
                lastName: 'Last',
                companyEmail: email,
                currentTitle: 'Engineer',
                team: 'Engineering',
                hireDate: '2015-01-30', // Aries suggests ISO 8601 format (yyyy-mm-dd)
                officeLocation: 'Cloud',
                'photo~attach': '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
                type: 'Staff',
                endDate: ''
            }
        };
        return request(process.env.API_GATEWAY_URL)
            .post('/v2/kiva/api/guardian/onboard')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.agentId).toBeDefined();
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Verify employee in guardianship', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'employee.proof.request.json',
            guardianData: {
                pluginType: 'SMS_OTP',
                filters: {
                    externalIds: {
                        company_email: email
                    }
                },
                params: {
                    phoneNumber
                },
            },
        };
        return request(process.env.API_GATEWAY_URL)
            .post(`/v2/kiva/api/guardian/verify`)
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.status).toBe('sent');
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });
});
