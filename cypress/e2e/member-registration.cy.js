describe('Member Registration E2E', () => {
  let groupId;

  before(() => {
    // Create a test reservation to get group ID
    cy.apiRequest('POST', '/api/reservations', {
      nombre: 'Test Group',
      contacto: '+1234567890',
      fecha: '2024-12-31',
      hora: '20:00',
      personas: 4,
      tipoMesa: 'estandar'
    }).then((response) => {
      expect(response.status).to.eq(201);
      groupId = response.body.groupId;
    });
  });

  it('should register member successfully', () => {
    // Visit member registration page
    cy.visit(`/member/${groupId}`);

    // Should show group information
    cy.contains('Test Group').should('be.visible');
    cy.contains('2024-12-31').should('be.visible');
    cy.contains('20:00').should('be.visible');

    // Fill member form
    cy.fillMemberForm({
      genero: 'masculino',
      instagram: 'test_user'
    });

    // Submit form
    cy.submitForm('Registrarse al Grupo');

    // Should show success message
    cy.verifySuccessMessage('¡Registro Exitoso!');
    
    // Should redirect after success
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should validate required fields', () => {
    cy.visit(`/member/${groupId}`);

    // Try to submit without selecting gender
    cy.submitForm('Registrarse al Grupo');

    // Should show validation error
    cy.verifyErrorMessage('género es obligatorio');
  });

  it('should handle invalid group ID', () => {
    const invalidGroupId = '123e4567-e89b-12d3-a456-426614174000';
    
    cy.visit(`/member/${invalidGroupId}`, { failOnStatusCode: false });

    // Should show error message
    cy.verifyErrorMessage('No se pudo cargar');
  });

  it('should validate Instagram username format', () => {
    cy.visit(`/member/${groupId}`);

    cy.fillMemberForm({
      genero: 'femenino',
      instagram: 'invalid@username!' // Invalid format
    });

    cy.submitForm('Registrarse al Grupo');

    // Should show format validation error
    cy.verifyErrorMessage('Invalid Instagram username format');
  });

  it('should work without Instagram (optional field)', () => {
    cy.visit(`/member/${groupId}`);

    cy.fillMemberForm({
      genero: 'otro'
      // No Instagram provided
    });

    cy.submitForm('Registrarse al Grupo');

    // Should succeed without Instagram
    cy.verifySuccessMessage('¡Registro Exitoso!');
  });

  it('should be mobile-friendly', () => {
    cy.viewport(375, 667); // Mobile viewport
    cy.visit(`/member/${groupId}`);

    // Form should be usable on mobile
    cy.get('select[name="genero"]').should('be.visible');
    cy.get('input[name="instagram"]').should('be.visible');
    cy.contains('Registrarse al Grupo').should('be.visible');

    // Test form interaction on mobile
    cy.fillMemberForm({
      genero: 'prefiero-no-decir'
    });

    cy.submitForm('Registrarse al Grupo');
    cy.verifySuccessMessage('¡Registro Exitoso!');
  });
});