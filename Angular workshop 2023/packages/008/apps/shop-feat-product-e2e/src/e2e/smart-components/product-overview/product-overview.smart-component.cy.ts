import { getInputSearch, getProductItems } from '../../../support/selectors';
import { products } from '@shoppie/shop/feat-product/mock-data';

describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=productoverviewsmartcomponent--primary')
  );
  it('should render the component', () => {
    getProductItems().should('have.length', products.length)
  });
  it('should search', () => {
    getInputSearch().type('1');
    getProductItems().should('have.length', 2)
  })
});
