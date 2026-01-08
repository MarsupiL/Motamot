describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=productdetailsmartcomponent--primary')
  );
  it('should render the component', () => {
    cy.get('sh-product-detail').should('exist');
  });
});
