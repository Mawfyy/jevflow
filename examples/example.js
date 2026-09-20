import { JevFlow, SystemOneProvider } from 'jevflow';

const provider = new SystemOneProvider();
const flow = new JevFlow();

const input = {
  question: 'What is the probability that a customer is satisfied with our product?',
  options: {
    a: 'Very satisfied',
    b: 'Somewhat satisfied',
    c: 'Not very satisfied',
    d: 'Not at all satisfied',
  },
};

const answer = await flow.evaluate(input, provider);

// console.log('Probability of each option:', answer.probabilities);
// console.log('Choice of customer:', answer.choice);
// console.log('Score of customer satisfaction:', answer.score);

const inputs = [
  {
    question: 'What is the probability that a customer is satisfied with our product?',
    options: {
      a: 'Very satisfied',
      b: 'Somewhat satisfied',
      c: 'Not very satisfied',
      d: 'Not at all satisfied',
    },
  },
  {
    question: 'What is the probability that a customer will recommend our product?',
    options: {
      a: 'Very likely',
      b: 'Somewhat likely',
      c: 'Neither likely nor unlikely',
      d: 'Somewhat unlikely',
    },
  },
];

const answers = await Promise.all(inputs.map((input) => flow.evaluate(input, provider)));

// console.log('Probabilities of each option:', answers.map((answer) => answer.probabilities));
// console.log('Choices of each question:', answers.map((answer) => answer.choice));
// console.log('Scores of each question:', answers.map((answer) => answer.score));

const input2 = {
  question: 'What is the probability that a customer is satisfied with our product?',
  options: {
    a: 'Very satisfied',
    b: 'Somewhat satisfied',
    c: 'Not very satisfied',
    d: 'Not at all satisfied',
  },
};

const answer2 = await flow.evaluate(input2, provider, {
  confidence: 0.7,
});

// console.log('Probability of each option:', answer2.probabilities);
// console.log('Choice of customer:', answer2.choice);
// console.log('Score of customer satisfaction:', answer2.score);

console.log('Answers:', answers);
console.log('answer2:', answer2);
