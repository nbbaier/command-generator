// Example CommandSpec templates

import { CommandSpec } from "../../types/command-spec";
import { randomUUID } from "crypto";

export const exampleSpecs: CommandSpec[] = [
  {
    // Template ID: should be a fixed string, not a random UUID at module load time
    id: "github-stars-template",
    title: "GitHub Stars",
    description: "View your starred GitHub repositories",
    mode: "list",
    icon: "⭐",
    steps: [
      {
        type: "httpRequest",
        config: {
          url: "https://api.github.com/user/starred",
          method: "GET",
          headers: {
            Authorization: "Bearer {{env.GITHUB_TOKEN}}",
            Accept: "application/vnd.github.v3+json",
          },
        },
        outputVar: "repos",
      },
    ],
    ui: {
      mode: "list",
      dataSource: "repos",
      itemProps: {
        title: "{{item.name}}",
        subtitle: "{{item.description}}",
        accessories: ["⭐ {{item.stargazers_count}}"],
      },
    },
    actions: [
      {
        title: "Open in Browser",
        icon: "🌐",
        operation: {
          type: "open",
          config: {
            target: "{{item.html_url}}",
          },
        },
      },
      {
        title: "Copy Clone URL",
        icon: "📋",
        operation: {
          type: "clipboard",
          config: {
            action: "copy",
            text: "{{item.clone_url}}",
          },
        },
      },
    ],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["github", "api", "development"],
      author: "template",
    },
  },
  {
    id: randomUUID(),
    title: "System Disk Usage",
    description: "Show disk usage information",
    mode: "detail",
    icon: "💾",
    steps: [
      {
        type: "shell",
        config: {
          command: "df -h",
          timeout: 5000,
        },
        outputVar: "diskInfo",
      },
    ],
    ui: {
      mode: "detail",
      dataSource: "diskInfo",
      content: "# Disk Usage\n\n```\n{{diskInfo.stdout}}\n```",
    },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["system", "disk", "monitoring"],
      author: "template",
    },
  },
  {
    id: randomUUID(),
    title: "Current Weather",
    description: "Get current weather (requires API key)",
    mode: "detail",
    icon: "🌤",
    steps: [
      {
        type: "httpRequest",
        config: {
          url: "https://api.openweathermap.org/data/2.5/weather?q=San Francisco&appid={{env.OPENWEATHER_API_KEY}}&units=metric",
          method: "GET",
        },
        outputVar: "weather",
      },
      {
        type: "transform",
        config: {
          template:
            "# Weather in {{weather.name}}\n\n**Temperature**: {{weather.main.temp}}°C\n**Feels like**: {{weather.main.feels_like}}°C\n**Humidity**: {{weather.main.humidity}}%\n**Conditions**: {{weather.weather.0.description}}",
          data: "{{weather}}",
        },
        outputVar: "markdown",
      },
    ],
    ui: {
      mode: "detail",
      dataSource: "markdown",
      content: "{{markdown}}",
    },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["weather", "api"],
      author: "template",
    },
  },
  {
    id: randomUUID(),
    title: "Hacker News Top Stories",
    description: "Browse top stories from Hacker News",
    mode: "list",
    icon: "📰",
    steps: [
      {
        type: "httpRequest",
        config: {
          url: "https://hacker-news.firebaseio.com/v0/topstories.json",
          method: "GET",
        },
        outputVar: "storyIds",
      },
      {
        type: "httpRequest",
        config: {
          url: "https://hacker-news.firebaseio.com/v0/item/{{storyIds.0}}.json",
          method: "GET",
        },
        outputVar: "story1",
      },
      {
        type: "httpRequest",
        config: {
          url: "https://hacker-news.firebaseio.com/v0/item/{{storyIds.1}}.json",
          method: "GET",
        },
        outputVar: "story2",
      },
      {
        type: "httpRequest",
        config: {
          url: "https://hacker-news.firebaseio.com/v0/item/{{storyIds.2}}.json",
          method: "GET",
        },
        outputVar: "story3",
      },
      {
        type: "transform",
        config: {
          template: "{{#each stories}}{{this}},{{/each}}",
          data: { stories: [story1, story2, story3] },
        },
        outputVar: "stories",
      },
    ],
    ui: {
      mode: "list",
      dataSource: "stories",
      itemProps: {
        title: "{{item.title}}",
        subtitle: "by {{item.by}} | {{item.score}} points",
      },
    },
    actions: [
      {
        title: "Open in Browser",
        icon: "🌐",
        operation: {
          type: "open",
          config: {
            target: "{{item.url}}",
          },
        },
      },
    ],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["news", "api", "hacker-news"],
      author: "template",
    },
  },
  {
    id: randomUUID(),
    title: "IP Address Lookup",
    description: "Get your current IP address and location",
    mode: "detail",
    icon: "🌍",
    steps: [
      {
        type: "httpRequest",
        config: {
          url: "https://ipapi.co/json/",
          method: "GET",
        },
        outputVar: "ipInfo",
      },
    ],
    ui: {
      mode: "detail",
      dataSource: "ipInfo",
      content:
        "# IP Address Information\n\n**IP**: {{ipInfo.ip}}\n**City**: {{ipInfo.city}}\n**Region**: {{ipInfo.region}}\n**Country**: {{ipInfo.country_name}}\n**Timezone**: {{ipInfo.timezone}}\n**ISP**: {{ipInfo.org}}",
    },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["network", "api", "location"],
      author: "template",
    },
  },
];
