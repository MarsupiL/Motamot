export const getInputSearch = () => cy.get('[data-cy="input__search"]');
export const getProductItems = () => cy.get('[data-cy="product__item"]');
export const getProductItem = (index: number) => getProductItems().eq(index);
