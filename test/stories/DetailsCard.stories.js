import DetailsCard from '../../src/DetailsCard.js';
import EXPECTED_RESPONSE from '../EXPECTED_RESPONSE.json';

console.log('@@@@@@@@@@', EXPECTED_RESPONSE);

export default {
  title: 'Client/DetailsCard',
  component: DetailsCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = {
    name: 'I am the primary',
    render: () => <DetailsCard rate={EXPECTED_RESPONSE[0]} toggleFavorite={() => {}} isFavorite={false} emphasize={[]} />
}
