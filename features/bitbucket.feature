Feature: The Bitbucket plugin on a project row
  Once the plugin is activated and installed, every project whose git remote is on Bitbucket carries
  the BITBUCKET menu, and the Plugins page lists the plugin with its four steps.

  Scenario: A project cloned from Bitbucket offers the BITBUCKET menu
    Given I am on "/dev"
     Then the element ".act-menu-bitbucket" should be displayed
      And I should see "BITBUCKET"

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Bitbucket"
      And I should see "@webship.co/workspace-bitbucket"
