// Cypress support file
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  return false;
});

// Custom commands for common actions
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('cleanTestData', () => {
  cy.task('cleanDatabase');
});

// API helpers
Cypress.Commands.add('apiRequest', (method, url, body = null) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    failOnStatusCode: false
  });
});

// Wait for API to be ready
Cypress.Commands.add('waitForAPI', () => {
  cy.request({
    url: `${Cypress.env('apiUrl')}/health`,
    retryOnStatusCodeFailure: true,
    timeout: 30000
  }).should((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.status).to.eq('healthy');
  });
});

// Setup before each test
beforeEach(() => {
  cy.waitForAPI();
  cy.cleanTestData();
});