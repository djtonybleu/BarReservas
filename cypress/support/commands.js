// Custom Cypress commands

// Fill reservation form
Cypress.Commands.add('fillReservationForm', (data) => {
  cy.get('input[name="nombre"]').type(data.nombre);
  cy.get('input[name="contacto"]').type(data.contacto);
  cy.get('input[name="fecha"]').type(data.fecha);
  cy.get('input[name="hora"]').type(data.hora);
  cy.get('input[name="personas"]').clear().type(data.personas.toString());
  cy.get('select[name="tipoMesa"]').select(data.tipoMesa);
  
  if (data.observaciones) {
    cy.get('textarea[name="observaciones"]').type(data.observaciones);
  }
});

// Submit form and wait for response
Cypress.Commands.add('submitForm', (buttonText = 'Crear Reserva') => {
  cy.contains('button', buttonText).click();
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist');
});

// Check QR code display
Cypress.Commands.add('verifyQRDisplay', () => {
  cy.contains('¡Reserva Confirmada!').should('be.visible');
  cy.get('[data-testid="qr-code"]').should('be.visible');
  cy.contains('Descargar QR').should('be.visible');
  cy.contains('Compartir').should('be.visible');
});

// Navigate using mobile or desktop navigation
Cypress.Commands.add('navigateTo', (pageName) => {
  // Try desktop navigation first
  cy.get('body').then(($body) => {
    if ($body.find('nav.hidden.md\\:flex').length > 0) {
      // Desktop navigation
      cy.get('nav.hidden.md\\:flex').contains(pageName).click();
    } else {
      // Mobile navigation
      cy.get('.md\\:hidden').contains(pageName).click();
    }
  });
});

// Mock QR scanner
Cypress.Commands.add('mockQRScan', (groupId) => {
  // Simulate QR scan by directly navigating to group page
  cy.visit(`/member/${groupId}`);
});

// Fill member registration form
Cypress.Commands.add('fillMemberForm', (data) => {
  cy.get('select[name="genero"]').select(data.genero);
  
  if (data.instagram) {
    cy.get('input[name="instagram"]').type(data.instagram);
  }
});

// Check success message
Cypress.Commands.add('verifySuccessMessage', (message) => {
  cy.contains(message).should('be.visible');
  cy.get('[data-testid="success-icon"]').should('be.visible');
});

// Check error message
Cypress.Commands.add('verifyErrorMessage', (message) => {
  cy.contains(message).should('be.visible');
  cy.get('[data-testid="error-message"]').should('be.visible');
});

// Wait for element to be visible
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Check responsive design
Cypress.Commands.add('checkResponsive', () => {
  // Test mobile viewport
  cy.viewport(375, 667);
  cy.get('body').should('be.visible');
  
  // Test tablet viewport
  cy.viewport(768, 1024);
  cy.get('body').should('be.visible');
  
  // Test desktop viewport
  cy.viewport(1280, 720);
  cy.get('body').should('be.visible');
});