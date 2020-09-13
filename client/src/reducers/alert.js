import { SET_ALERT, REMOVE_ALERT } from '../actions/types';

const initialState = [];

export default function (state = initialState, action) {
   const { type, payload } = action;  // destruction
   switch (type) {
      case SET_ALERT:
         return [...state, payload];   // e.g. payload.msg, or payload.id, etc. Here is to add the 'setAlert' to the array, and you can see it in the Redux dev tools.
      case REMOVE_ALERT:
         return state.filter(alert => alert.id !== payload);
      default:
         return state;
   }
}