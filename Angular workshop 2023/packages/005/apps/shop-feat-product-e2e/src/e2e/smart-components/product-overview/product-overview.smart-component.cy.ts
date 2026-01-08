describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=productoverviewsmartcomponent--primary')
  );
  it('should render the component', () => {
    cy.get('sh-product-overview').should('exist');
  });
});
