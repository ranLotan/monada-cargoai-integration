import { action } from '@storybook/addon-actions';
import Settings from '../../src/client/Settings.js';

export default {
    title: 'Client/Settings',
    component: Settings,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'padded',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    decorators: [
    ]

};

export const Primary = {
    name: 'Primary',
    args: {
        enabled: true,
        setEnabled: action('setEnabled'),
        getConfiguration: (key, def) => _.get(INIT_CONFIGURATION, key, def),
        setConfiguration: action('setConfiguration'),
    }
}

const INIT_CONFIGURATION = {
    "enabled": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuYXZpYV9vZmZpY2UxQG9rYXJnby5jb20iLCJleHAiOjE4NjE5MTk5NzQsImlzcyI6Imh0dHBzOi8vYXBwLm9rYXJnby5jb20iLCJhdWQiOiJodHRwczovL2FwcC5va2FyZ28uY29tIn0.YhhjqDBe8nc17qUlJz8WNGompGYyrKn01hmXOCgieJ8",
    "platforms": [
        {
            "id": "2",
            "username": "samp@naviafreight.com",
            "password": "December2021!"
        },
        {
            "id": "13",
            "username": "Navia123",
            "password": "Procure2021!"
        },
        {
            "id": "16",
            "username": "joemolt@naviafreight.com",
            "password": "October9"
        },
        {
            "id": "3",
            "username": "NaviaQuotes",
            "password": "Quotes2023"
        },
        {
            "id": "11",
            "username": "NAVIAQUO",
            "password": "Quotes123!"
        },
        {
            "id": "15",
            "username": "consolalli",
            "password": "Navia2005!"
        },
        {
            "id": "5",
            "username": "Quotes@naviafreight.com",
            "password": "Navialog54#"
        },
        {
            "id": "12",
            "username": "quotes@naviafreight.com",
            "password": "Quotes123#"
        }
    ]
}
