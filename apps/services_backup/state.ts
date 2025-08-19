// Temporarily disabled - stub service for state management
class StateService {
  getState(key: string) {
    console.log('State retrieval temporarily disabled', { key });
    return null;
  }

  setState(key: string, value: any) {
    console.log('State setting temporarily disabled', { key, value });
  }

  clearState(key: string) {
    console.log('State clearing temporarily disabled', { key });
  }
}

export default new StateService();
