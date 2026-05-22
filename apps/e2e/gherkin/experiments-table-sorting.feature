Feature: Experiments table sorting

  Scenario Outline: Sort experiments table columns without backend sort field errors
    Given I am logged in as a user officer
    And I open the Experiments page
    And the experiments table is visible
    When I sort the table by the <column> column
    Then the table should be sorted by <column>
    And I should not see "Bad sort field given: startsAt"
    And I should not see "Bad sort field given: endsAt"
    And I should not see "Bad sort field given: proposal.proposalId"
    And I should not see "Bad sort field given: instrument.name"
    And I should not see "Bad sort field given: experimentSafety.status.name"

    Examples:
      | column                   |
      | Experiment ID            |
      | Proposal ID              |
      | Start                    |
      | End                      |
      | Instrument               |
      | Experiment Safety Status |
