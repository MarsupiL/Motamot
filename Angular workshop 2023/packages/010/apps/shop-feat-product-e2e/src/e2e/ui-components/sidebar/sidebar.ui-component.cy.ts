describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=sidebaruicomponent--primary&args=categories;')
  );
  it('should render the component', () => {
    cy.get('sh-sidebar').should('exist');
  });
});
