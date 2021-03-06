import request from 'supertest';
import nock from 'nock';

const sendMockedPost = (): request.Test => {
    const baseUrl = 'https://fakeAuthUrl.com';
    nock(baseUrl)
      .post('/oauth/token')
      .reply(200, { access_token: 'mockTestToken' });

    return request('https://fakeAuthUrl.com')
        .post('/oauth/token')
        .set('content-type', 'application/json')
        .send({});
};

const getAuth0Token = (): request.Test => {
    const {AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN} = process.env;
    if (AUTH0_CLIENT_ID && AUTH0_CLIENT_SECRET && AUTH0_DOMAIN) {
        const auth0Data = {
            client_id: AUTH0_CLIENT_ID,
            client_secret: AUTH0_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            grant_type: 'client_credentials',
        };

        return request(`https://${process.env.AUTH0_DOMAIN}`)
            .post('/oauth/token')
            .set('content-type', 'application/json')
            .send(auth0Data);
    }

    return sendMockedPost();
};

export default getAuth0Token;
