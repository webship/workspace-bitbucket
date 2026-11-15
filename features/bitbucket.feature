Feature: The Bitbucket plugin on a project row
  Once the plugin is activated and installed, every project whose git remote is on Bitbucket carries
  the BITBUCKET menu, and the Plugins page lists the plugin with its four steps.

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Bitbucket"
      And I should see "@webship.co/workspace-bitbucket"

  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents"
     Then I should see "bitbucket-pr-preparer"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills"
     Then I should see "bitbucket-forge"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands"
     Then I should see "bitbucket-status"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts"
     Then I should see "bitbucket-branch-to-pr"
