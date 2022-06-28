import {test, expect} from '@playwright/test';

let page: any, email: string;

test.beforeAll(async ({browser}) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('http://localhost:7567');
});

const credentialData = {
    firstName: 'Kiva',
    lastName: 'Microfunds',
    companyEmail: Math.random().toString(36).substring(2) + '@kiva.org',
    hireDate: '11/11/2011',
    currentTitle: 'Company',
    team: 'Protocol',
    officeLocation: 'San Francisco',
    type: 'Full Time',
    endDate: '11/11/2111',
    phoneNumber: '+12345678909'
};

test.describe('The SSIrius app', () => {

    test('successfully registers a new user using their fingerprint', async () => {
        await page.waitForSelector('[data-cy="confirmation"]');
        await page.click('.accept');
        await page.locator('text="Fingerprint Registration"').click();
        await page.click('#select-auth-method');
        await page.locator('.files input').setInputFiles('images/kiva.jpg');
        await page.click('[data-cy="image-select-continue"]');
        // eslint-disable-next-line guard-for-in
        for (const key in credentialData) {
            await page.locator('#' + key).type(credentialData[key]);
        }
        await page.click('.next');
        await page.click('#finger-id-1');
        await page.waitForTimeout(500);
        await Promise.all([
            page.waitForResponse('http://localhost:8080/v2/kiva/api/guardian/onboard'),
            page.click('[type="submit"]')
        ]).then(async () => {
            const toastSuccess = await page.locator('text="Credential was successfully issued!"');
            expect(toastSuccess.isVisible()).toBeTruthy();
        });
    });

    test('successfully verifies the identity of the previously registered user via their fingerprint', async () => {
        await page.click('[data-cy="restart-ekyc"]');
        await page.waitForSelector('[data-cy="confirmation"]');
        await page.click('.accept');
        await page.locator('text="Fingerprint Scan"').click();
        await page.click('#select-auth-method');
        await page.locator('#id-input').type(credentialData.companyEmail);
        await page.click('#scan-fingerprint');
        await page.waitForSelector('[alt="Scan finished with status: success!"]');
        await page.click('[data-cy="fpscan-next"]');
        await page.screenshot();
        const profileImage = await page.waitForSelector('.PictureProfile');
        const imageVisibility = await profileImage.isVisible();
        expect(imageVisibility).toBeTruthy();
        const cardList = await page.locator('.FieldCard').evaluateAll((cards: any[]) => cards.map(c => {
            return {
                title: c.querySelector('.FieldCardTitle').innerText,
                value: c.querySelector('.FieldCardValue').innerText
            };
        }));

        const companyEmailField = cardList.filter(card => card.title === 'Company Email');
        expect(companyEmailField.length).toEqual(1);
        expect(companyEmailField[0].value).toEqual(credentialData.companyEmail);
    });
});

