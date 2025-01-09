export default {
  title: 'DojoPool Documentation',
  description: 'Documentation and guidelines for the DojoPool project',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Components', link: '/components/' },
      { text: 'Styles', link: '/styles/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Project Structure', link: '/guide/structure' }
          ]
        },
        {
          text: 'Development',
          items: [
            { text: 'Coding Standards', link: '/guide/coding-standards' },
            { text: 'Git Workflow', link: '/guide/git-workflow' },
            { text: 'Testing', link: '/guide/testing' }
          ]
        }
      ],
      '/components/': [
        {
          text: 'Core Components',
          items: [
            { text: 'Buttons', link: '/components/buttons' },
            { text: 'Forms', link: '/components/forms' },
            { text: 'Cards', link: '/components/cards' },
            { text: 'Modals', link: '/components/modals' },
            { text: 'Navigation', link: '/components/navigation' },
            { text: 'Tables', link: '/components/tables' },
            { text: 'Alerts', link: '/components/alerts' },
            { text: 'Loaders', link: '/components/loaders' },
            { text: 'Tooltips', link: '/components/tooltips' },
            { text: 'Badges', link: '/components/badges' },
            { text: 'Avatars', link: '/components/avatars' }
          ]
        }
      ],
      '/styles/': [
        {
          text: 'Design System',
          items: [
            { text: 'Colors', link: '/styles/colors' },
            { text: 'Typography', link: '/styles/typography' },
            { text: 'Spacing', link: '/styles/spacing' },
            { text: 'Grid', link: '/styles/grid' },
            { text: 'Themes', link: '/styles/themes' }
          ]
        },
        {
          text: 'Guidelines',
          items: [
            { text: 'Accessibility', link: '/styles/accessibility' },
            { text: 'Responsive Design', link: '/styles/responsive' },
            { text: 'Performance', link: '/styles/performance' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/dojo-pool' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present DojoPool'
    },
    search: {
      provider: 'local'
    }
  }
} 