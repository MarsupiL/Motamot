describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=categorydetailsmartcomponent--primary')
  );
  it('should render the component', () => {
    cy.get('sh-category-detail').should('exist');
  });
});
