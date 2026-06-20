describe("Findora smoke", () => {
  it("loads home page", () => {
    cy.visit("/");
    cy.contains("Findora");
    cy.contains("reunited");
  });

  it("navigates to login", () => {
    cy.visit("/login");
    cy.contains("Welcome back");
  });
});
