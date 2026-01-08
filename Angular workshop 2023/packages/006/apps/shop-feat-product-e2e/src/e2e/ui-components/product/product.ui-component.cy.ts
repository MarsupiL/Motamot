describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=productuicomponent--primary&args=product;')
  );
  it('should render the component', () => {
    cy.get('sh-product').should('exist');
  });
});
