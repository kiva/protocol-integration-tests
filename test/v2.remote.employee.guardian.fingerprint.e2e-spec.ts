import request from 'supertest';
import { jest } from '@jest/globals';
import { inspect } from 'util';
import { readFileSync } from 'fs';
import { ProtocolErrorCode } from 'protocol-common';
import { delayFunc } from './util/time.util';

jest.setTimeout(60000);

/**
 * Test the issuing and verifying of employee credentials for guardianship
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 */
describe('Full system issue and verify flows for employee credentials', () => {
  let auth0Token: string;
  let email: string;
  let fingerprintEnroll: string;
  let fingerprintVerify: string;
  let credExId: string;
  let verifyData: object;

  beforeAll(() => {
    // Note that the register endpoint expects images hex encoded, and the kyc endpoint base64
    fingerprintEnroll = readFileSync('./images/fingerprint3.png').toString('hex');
    fingerprintVerify = readFileSync('./images/fingerprint3.png').toString('base64');
    // We use email as the employees unique identifier so needs to be unique
    const id = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
    email = `company${id}@email.com`;
    verifyData = {
      profile: 'employee.proof.request.json',
      guardianData: {
        pluginType: 'FINGERPRINT',
        filters: {
          externalIds: {
            companyEmail: email
          }
        },
        params: {
          image: fingerprintVerify,
          position: 1,
        },
      },
    };
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
          auth0Token = `Bearer ${res.body.access_token as string}`;
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  it('Enroll employee in guardianship', async () => {
    await delayFunc(5000);
    const data: any = {
      guardianData: [{
        pluginType: 'FINGERPRINT',
        filters: {
          externalIds: {
            companyEmail: email
          }
        },
        params:
          {
            image: fingerprintEnroll,
            position: '1',
            type_id: '1',
            capture_date: '2021-04-05T13:22:59.000Z',
            missing_code: null,
          },
      }]
    };
    return request(process.env.API_GATEWAY_URL)
      .post('/v2/kiva/api/guardian/enroll')
      .set('Authorization', auth0Token)
      .send(data)
      .expect((res) => {
        try {
          expect(res.status).toBe(201);
          expect(res.body.id).toBeDefined();
          expect(res.body.connectionData).toBeDefined();
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  it('Error case: ProofFailedUnfulfilled (no credential issued yet)', async () => {
    await delayFunc(1000);
    return request(process.env.API_GATEWAY_URL)
      .post('/v2/kiva/api/guardian/verify')
      .set('Authorization', auth0Token)
      .send(verifyData)
      .expect((res) => {
        try {
          expect(res.status).toBe(400);
          expect(res.body.code).toBe(ProtocolErrorCode.PROOF_FAILED_UNFULFILLED);
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  it('Issue employee credential', async () => {
    await delayFunc(5000);
    const data: any = {
      profile: 'employee.cred.def.json',
      guardianVerifyData: {
        pluginType: 'FINGERPRINT',
        filters: {
          externalIds: {
            companyEmail: email
          }
        },
        params: {
          image: fingerprintVerify,
          position: 1,
        },
      },
      entityData : {
        firstName: 'First',
        lastName: 'Last',
        companyEmail: email,
        currentTitle: 'Engineer',
        team: 'Engineering',
        hireDate: '1420070400', // 1/1/2015
        officeLocation: 'Cloud',
        'photo~attach':
            '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
        type: 'Staff',
        endDate: '',
        phoneNumber: '+16282185460'
      }
    };
    return request(process.env.API_GATEWAY_URL)
      .post('/v2/kiva/api/guardian/issue')
      .set('Authorization', auth0Token)
      .send(data)
      .expect((res) => {
        try {
          expect(res.status).toBe(201);
          expect(res.body.agentId).toBeDefined();
          expect(res.body.agentData.credential_exchange_id).toBeDefined();
          credExId = res.body.agentData.credential_exchange_id;
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  it('Verify employee in guardianship', async () => {
    await delayFunc(1000);
    return request(process.env.API_GATEWAY_URL)
      .post('/v2/kiva/api/guardian/verify')
      .set('Authorization', auth0Token)
      .send(verifyData)
      .expect((res) => {
        try {
          expect(res.status).toBe(201);
          expect(res.body.companyEmail).toBe(email);
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  it('Revoke credential in guardianship', async () => {
    await delayFunc(100);
    const data = {
      credentialExchangeId: credExId,
      publish: true
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

  it('Error case: ProofFailedVerification', async () => {
    await delayFunc(1000);
    return request(process.env.API_GATEWAY_URL)
      .post('/v2/kiva/api/guardian/verify')
      .set('Authorization', auth0Token)
      .send(verifyData)
      .expect((res) => {
        try {
          expect(res.status).toBe(400);
          expect(res.body.code).toBe(ProtocolErrorCode.PROOF_FAILED_VERIFICATION);
        } catch (e) {
          e.message = `${e.message as string}\nDetails: ${inspect(res.body)}`;
          throw e;
        }
      });
  });

  // TODO ProofFailedNoResponse: There's not a great way to test this error case,
  // it's more of a catch all for when there's an issue with the holder's agent
});
