Feature: Experiments table sorting

  Scenario: Sort experiments table by End date without backend sort field errors
    Given I am logged in as a user officer
    And I open the Experiments page
    And the experiments table is visible
    When I sort the table by the End column
    Then the table should be sorted by End date
    And I should not see "Bad sort field given: startsAt"
    And I should not see "Bad sort field given: endsAt"
