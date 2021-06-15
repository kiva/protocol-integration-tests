import request from 'supertest';

/**
 * Integration test for our app, this ensures that the production docker image was built correctly
 * This expects the docker containers to be running and return a healthy response
 */
describe('Prod integration test', () => {

    it('Guardianship Agency up', () => {
        return request('http://localhost:3010')
        .get('/healthz')
        .expect(200);
    });

    it('Key Guardian up', () => {
        return request('http://localhost:3005')
        .get('/healthz')
        .expect(200);
    });

    it('Kiva Controller up', () => {
        return request('http://localhost:3011')
        .get('/healthz')
        .expect(200);
    });

    it('FSP Controller up', () => {
        return request('http://localhost:3013')
        .get('/healthz')
        .expect(200);
    });

    it('Demo Controller up', () => {
        return request('http://localhost:3014')
          .get('/healthz')
          .expect(200);
    });
});
