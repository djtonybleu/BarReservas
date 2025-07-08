describe('Reservation Flow E2E', () => {
  const testReservation = {
    nombre: 'Juan Pérez Test',
    contacto: '+1234567890',
    fecha: '2024-12-31',
    hora: '20:00',
    personas: 4,
    tipoMesa: 'estandar',
    observaciones: 'Mesa cerca de la ventana'
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete full reservation flow', () => {
    // Navigate to reservation page
    cy.navigateTo('Reservar');
    cy.url().should('include', '/reservation');

    // Fill and submit reservation form
    cy.fillReservationForm(testReservation);
    cy.submitForm();

    // Verify QR code is displayed
    cy.verifyQRDisplay();

    // Verify reservation details are shown
    cy.contains(testReservation.nombre).should('be.visible');
    cy.contains(testReservation.fecha).should('be.visible');
    cy.contains(testReservation.hora).should('be.visible');
    cy.contains(testReservation.personas.toString()).should('be.visible');

    // Test QR code download
    cy.contains('Descargar QR').should('be.visible');
    
    // Test sharing functionality
    cy.contains('Compartir').should('be.visible');
    
    // Test copy link functionality
    cy.contains('Copiar Link').click();
    cy.contains('Copiado').should('be.visible');
  });

  it('should validate form inputs', () => {
    cy.navigateTo('Reservar');

    // Try to submit empty form
    cy.submitForm();
    
    // Should show validation errors
    cy.contains('Por favor completa').should('be.visible');

    // Test invalid email format
    cy.get('input[name="nombre"]').type('Test User');
    cy.get('input[name="contacto"]').type('invalid-contact');
    cy.submitForm();
    
    // Should show format validation error
    cy.verifyErrorMessage('Invalid');
  });

  it('should handle past date validation', () => {
    cy.navigateTo('Reservar');

    const pastReservation = {
      ...testReservation,
      fecha: '2020-01-01' // Past date
    };

    cy.fillReservationForm(pastReservation);
    cy.submitForm();

    // Should show past date error
    cy.verifyErrorMessage('2 horas de anticipación');
  });

  it('should be responsive', () => {
    cy.navigateTo('Reservar');
    cy.checkResponsive();
    
    // Form should be usable on all screen sizes
    cy.viewport(375, 667); // Mobile
    cy.get('input[name="nombre"]').should('be.visible');
    
    cy.viewport(1280, 720); // Desktop
    cy.get('input[name="nombre"]').should('be.visible');
  });
});