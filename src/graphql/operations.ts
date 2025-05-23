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

export const SET_USER_COLOR_MUTATION = gql`
  mutation SetUserColor($color: String!) {
    setUserColor(color: $color) {
      success
      color
      message
    }
  }
`;

export const SEND_CHAT_MESSAGE_MUTATION = gql`
  mutation SendChatMessage($message: String!) {
    sendChatMessage(message: $message) {
      id
      type
      timestamp
      user
      message
    }
  }
`;

// Activity feed operations
export const GET_ACTIVITIES_QUERY = gql`
  query GetActivities {
    activities {
      id
      type
      timestamp
      user
      message
      roll {
        id
        user
        expression
        interpretedExpression
        result
        rolls
      }
    }
  }
`;

export const ACTIVITY_ADDED_SUBSCRIPTION = gql`
  subscription ActivityAdded {
    activityAdded {
      id
      type
      timestamp
      user
      message
      roll {
        id
        user
        expression
        interpretedExpression
        result
        rolls
      }
    }
  }
`;

export const GET_ACTIVE_USERS_QUERY = gql`
  query GetActiveUsers {
    activeUsers {
      sessionId
      username
      color
      isActive
    }
  }
`;

export const USER_LIST_CHANGED_SUBSCRIPTION = gql`
  subscription UserListChanged {
    userListChanged {
      sessionId
      username
      color
      isActive
    }
  }
`;
