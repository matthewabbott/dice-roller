import { gql } from '@apollo/client';

export const REGISTER_USERNAME_MUTATION = gql`
  mutation RegisterUsername($username: String!) {
    registerUsername(username: $username) {
      success
      username
      message
    }
  }
`;

export const ROLL_DICE_MUTATION = gql`
  mutation RollDice($user: String!, $expression: String!) {
    rollDice(user: $user, expression: $expression) {
      id
      user
      expression
      interpretedExpression
      result
      rolls
    }
  }
`;

export const ROLL_ADDED_SUBSCRIPTION = gql`
  subscription RollAdded {
    rollAdded {
      id
      user
      expression
      interpretedExpression
      result
      rolls
    }
  }
`;

// Get all existing rolls
export const GET_ROLLS_QUERY = gql`
  query GetRolls {
    rolls {
      id
      user
      expression
      interpretedExpression
      result
      rolls
    }
  }
`;
