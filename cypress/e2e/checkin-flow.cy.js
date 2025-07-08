describe('Check-in Flow E2E', () => {
  let groupId, memberId;

  before(() => {
    // Create test reservation and member
    cy.apiRequest('POST', '/api/reservations', {
      nombre: 'Check-in Test Group',
      contacto: '+1234567890',
      fecha: '2024-12-31',
      hora: '20:00',
      personas: 4,
      tipoMesa: 'vip'
    }).then((response) => {
      groupId = response.body.groupId;
      
      // Add a member to the group
      return cy.apiRequest('POST', `/api/groups/${groupId}/miembro`, {
        genero: 'masculino',
        instagram: 'test_member'
      });
    }).then((response) => {
      memberId = response.body.id;
    });
  });

  it('should complete check-in flow', () => {
    // Navigate to check-in page
    cy.visit('/checkin');
    cy.contains('Check-in Host').should('be.visible');

    // Mock QR scan by directly loading group
    cy.mockQRScan(groupId);

    // Should show group panel
    cy.contains('Check-in Test Group').should('be.visible');
    cy.contains('2024-12-31').should('be.visible');
    cy.contains('20:00').should('be.visible');
    cy.contains('vip').should('be.visible');

    // Should show member list
    cy.contains('Miembro #1').should('be.visible');
    cy.contains('masculino').should('be.visible');
    cy.contains('@test_member').should('be.visible');

    // Check-in member
    cy.contains('Ingresar').click();
    
    // Should show success message
    cy.contains('¡Check-in exitoso!').should('be.visible');
    
    // Button should change to check-out
    cy.contains('Marcar Salida').should('be.visible');
    
    // Progress should update
    cy.contains('1 de 1 miembros han ingresado').should('be.visible');
    cy.get('[style*="width: 100%"]').should('exist'); // Progress bar at 100%
  });

  it('should handle check-out', () => {
    cy.visit('/checkin');
    cy.mockQRScan(groupId);

    // Member should be checked in from previous test
    cy.contains('Marcar Salida').click();
    
    // Should show check-out message
    cy.contains('Check-out realizado').should('be.visible');
    
    // Button should change back to check-in
    cy.contains('Ingresar').should('be.visible');
    
    // Progress should update
    cy.contains('0 de 1 miembros han ingresado').should('be.visible');
  });

  it('should refresh group data', () => {
    cy.visit('/checkin');
    cy.mockQRScan(groupId);

    // Click refresh button
    cy.contains('Actualizar').click();
    
    // Should reload group data
    cy.contains('Check-in Test Group').should('be.visible');
  });

  it('should handle empty group', () => {
    // Create group without members
    cy.apiRequest('POST', '/api/reservations', {
      nombre: 'Empty Group',
      contacto: '+1234567890',
      fecha: '2024-12-31',
      hora: '21:00',
      personas: 2,
      tipoMesa: 'estandar'
    }).then((response) => {
      const emptyGroupId = response.body.groupId;
      
      cy.visit('/checkin');
      cy.mockQRScan(emptyGroupId);

      // Should show empty state
      cy.contains('Aún no hay miembros registrados').should('be.visible');
      cy.contains('escanear el código QR para registrarse').should('be.visible');
    });
  });

  it('should show group statistics', () => {
    cy.visit('/checkin');
    cy.mockQRScan(groupId);

    // Should show reservation details
    cy.contains('Información de la Reserva').should('be.visible');
    cy.contains('Fecha y Hora').should('be.visible');
    cy.contains('Personas').should('be.visible');
    cy.contains('Tipo de Mesa').should('be.visible');
    cy.contains('Check-in').should('be.visible');

    // Should show progress bar
    cy.get('[class*="bg-green-500"]').should('exist'); // Progress bar
  });

  it('should be responsive on mobile', () => {
    cy.viewport(375, 667); // Mobile
    cy.visit('/checkin');
    cy.mockQRScan(groupId);

    // Should display properly on mobile
    cy.contains('Check-in Test Group').should('be.visible');
    cy.contains('Miembro #1').should('be.visible');
    cy.contains('Ingresar').should('be.visible');

    // Mobile-specific layout should work
    cy.get('.grid').should('exist');
    cy.get('.space-y-3').should('exist');
  });

  it('should handle network errors gracefully', () => {
    // Intercept API calls to simulate network error
    cy.intercept('PATCH', '/api/groups/*/miembro/*', {
      statusCode: 500,
      body: { error: 'Network error' }
    }).as('checkInError');

    cy.visit('/checkin');
    cy.mockQRScan(groupId);

    cy.contains('Ingresar').click();
    cy.wait('@checkInError');

    // Should show error message
    cy.verifyErrorMessage('Error al actualizar el estado del miembro');
  });
});