import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MuiLink,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  GitHub,
} from '@mui/icons-material';
import Link from 'next/link';

const Footer = () => {
  const theme = useTheme();

  const footerLinks = {
    company: [
      { text: 'About Us', href: '/about' },
      { text: 'Contact', href: '/contact' },
      { text: 'Careers', href: '/careers' },
      { text: 'Press', href: '/press' },
    ],
    resources: [
      { text: 'Blog', href: '/blog' },
      { text: 'Documentation', href: '/docs' },
      { text: 'Support', href: '/support' },
      { text: 'Terms of Service', href: '/terms' },
    ],
    features: [
      { text: 'Tournaments', href: '/tournaments' },
      { text: 'Venues', href: '/venues' },
      { text: 'Analytics', href: '/analytics' },
      { text: 'Training', href: '/training' },
    ],
  };

  const socialLinks = [
    { icon: React.createElement(Facebook), href: 'https://facebook.com/dojopool' },
    { icon: React.createElement(Twitter), href: 'https://twitter.com/dojopool' },
    { icon: React.createElement(Instagram), href: 'https://instagram.com/dojopool' },
    { icon: React.createElement(LinkedIn), href: 'https://linkedin.com/company/dojopool' },
    { icon: React.createElement(GitHub), href: 'https://github.com/dojopool' },
  ];

  return React.createElement(
    Box,
    {
      component: 'footer',
      sx: {
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
    React.createElement(
      Container,
      { maxWidth: 'lg' },
      React.createElement(
        Grid,
        { container: true, spacing: 4, justifyContent: 'space-evenly' },
        React.createElement(
          Grid,
          { item: true, xs: 12, sm: 6, md: 3 },
          React.createElement(
            Typography,
            { variant: 'h6', gutterBottom: true },
            'DojoPool'
          ),
          React.createElement(
            Typography,
            { variant: 'body2', color: 'inherit' },
            'Transforming pool gaming into an immersive, tech-enhanced experience.'
          ),
          React.createElement(
            Box,
            { sx: { mt: 2 } },
            socialLinks.map((social, index) =>
              React.createElement(
                IconButton,
                {
                  key: index,
                  color: 'inherit',
                  component: MuiLink,
                  href: social.href,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
                social.icon
              )
            )
          )
        ),

        React.createElement(
          Grid,
          { item: true, xs: 12, sm: 6, md: 3 },
          React.createElement(
            Typography,
            { variant: 'h6', gutterBottom: true },
            'Company'
          ),
          footerLinks.company.map((link, index) =>
            React.createElement(
              Box,
              { key: index, sx: { mb: 1 } },
              React.createElement(
                Link,
                { href: link.href, passHref: true },
                React.createElement(
                  MuiLink,
                  { color: 'inherit', underline: 'hover' },
                  link.text
                )
              )
            )
          )
        ),

        React.createElement(
          Grid,
          { item: true, xs: 12, sm: 6, md: 3 },
          React.createElement(
            Typography,
            { variant: 'h6', gutterBottom: true },
            'Resources'
          ),
          footerLinks.resources.map((link, index) =>
            React.createElement(
              Box,
              { key: index, sx: { mb: 1 } },
              React.createElement(
                Link,
                { href: link.href, passHref: true },
                React.createElement(
                  MuiLink,
                  { color: 'inherit', underline: 'hover' },
                  link.text
                )
              )
            )
          )
        ),

        React.createElement(
          Grid,
          { item: true, xs: 12, sm: 6, md: 3 },
          React.createElement(
            Typography,
            { variant: 'h6', gutterBottom: true },
            'Features'
          ),
          footerLinks.features.map((link, index) =>
            React.createElement(
              Box,
              { key: index, sx: { mb: 1 } },
              React.createElement(
                Link,
                { href: link.href, passHref: true },
                React.createElement(
                  MuiLink,
                  { color: 'inherit', underline: 'hover' },
                  link.text
                )
              )
            )
          )
        )
      ),

      React.createElement(
        Box,
        { sx: { mt: 5, textAlign: 'center' } },
        React.createElement(
          Typography,
          { variant: 'body2', color: 'inherit' },
          `© ${new Date().getFullYear()} DojoPool. All rights reserved.`
        )
      )
    )
  );
};

export default Footer; 