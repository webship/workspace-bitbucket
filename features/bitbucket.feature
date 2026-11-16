Feature: The Bitbucket plugin on a project row
  Once the plugin is activated and installed, every project whose git remote is on Bitbucket carries
  the BITBUCKET menu, and the Plugins page lists the plugin with its four steps.

  # The Plugins page names each plugin; the package is on the plugin's own page (the row shows it on hover only).
  Scenario: The plugin is listed on the Plugins page, and its own page names its package
    Given I am on "/settings/plugins"
     Then I should see "Bitbucket"
     When I go to "/settings/plugin/bitbucket"
     Then I should see "@webship.co/workspace-bitbucket"

  # The AI folders are searched by name: with every plugin on, a folder lists more than one page of items.
  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents?q=bitbucket-pr-preparer"
     Then I should see "bitbucket-pr-preparer"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills?q=bitbucket-forge"
     Then I should see "bitbucket-forge"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands?q=bitbucket-status"
     Then I should see "bitbucket-status"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts?q=bitbucket-branch-to-pr"
     Then I should see "bitbucket-branch-to-pr"
