import request from 'supertest';
import { jest } from '@jest/globals';
import { inspect } from 'util';
import { delayFunc } from './util/time.util';
import getAuth0Token from './util/auth0.token.util';

jest.setTimeout(60000);

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

    beforeAll(() => {
        // We use email as the employees unique identifier so needs to be unique
        const id = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        email = `company${id}@email.com`;
    });

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
                'photo~attach':
                    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
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
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
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
            .post('/v2/kiva/api/guardian/verify')
            .set('Authorization', auth0Token)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.status).toBe('sent');
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
                    throw e;
                }
            });
    });
});
