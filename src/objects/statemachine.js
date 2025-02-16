import State from "./state";
/**
 * StateMachine handle state and its management. Call step() to proceed with current state and transition() for going to another state.
 */
export default class StateMachine {
  /**
   * 
   * @param {State} initialState The initial state
   * @param {Array}[State] possibleStates Map of states that can be employed
   * @param {...any} stateArgs 
   */
    constructor(initialState, possibleStates, stateArgs=[]) {
      this.initialState = initialState;
      this.possibleStates = possibleStates;
      this.stateArgs = stateArgs;
      this.state = null;
  
      // State instances get access to the state machine via this.stateMachine.
      for (const state of Object.values(this.possibleStates)) {
        state.stateMachine = this;
      }
    }
  
    step() {
      // On the first step, the state is null and we need to initialize the first state.
      if (this.state === null) {
        this.state = this.initialState;
        this.possibleStates[this.state].enter(...this.stateArgs);
      }
  
      // Run the current state's execute
      this.possibleStates[this.state].execute(...this.stateArgs);
    }
  
    /**
     * Transition to a new state
     * @param {State} newState New state to transition to
     * @param  {...any} enterArgs Arguments required by the state if any
     */
    transition(newState, ...enterArgs) {
      this.state = newState;
      this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs);
    }
  }