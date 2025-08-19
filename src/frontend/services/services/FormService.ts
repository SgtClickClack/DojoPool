import analyticsService from '@/services/analytics';
import stateService from '@/services/state';
import validationService from '@/services/validation';

interface FormField {
  value: any;
  touched: boolean;
  dirty: boolean;
  errors: string[];
  validating: boolean;
  asyncValidation?: Promise<string[]>;
}

interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  pristine: boolean;
  touched: boolean;
  errors: Record<string, string[]>;
}

interface FormConfig {
  id: string;
  initialValues: Record<string, any>;
  validationSchema?: string;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onReset?: () => void;
  onChange?: (values: Record<string, any>) => void;
  onError?: (errors: Record<string, string[]>) => void;
}

class FormService {
  private forms: Map<string, FormState> = new Map();
  private configs: Map<string, FormConfig> = new Map();
  private listeners: Map<string, Set<(state: FormState) => void>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupStateListener();
  }

  private setupStateListener(): void {
    stateService.select(
      (state) => state.ui.errors,
      (errors) => {
        Object.entries(errors).forEach(([formId, formErrors]) => {
          const form = this.forms.get(formId);
          if (form) {
            this.setErrors(formId, formErrors);
          }
        });
      }
    );
  }

  public registerForm(config: FormConfig): void {
    const formState: FormState = {
      fields: {},
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
      pristine: true,
      touched: false,
      errors: {},
    };

    // Initialize fields
    Object.entries(config.initialValues).forEach(([name, value]) => {
      formState.fields[name] = {
        value,
        touched: false,
        dirty: false,
        errors: [],
        validating: false,
      };
    });

    this.forms.set(config.id, formState);
    this.configs.set(config.id, config);
    this.listeners.set(config.id, new Set());

    // Track form registration in analytics
    analyticsService.trackUserEvent({
      type: 'form_registered',
      userId: 'system',
      details: {
        formId: config.id,
        timestamp: new Date().toISOString(),
      },
    });

    // Perform initial validation
    if (config.validationSchema) {
      this.validateForm(config.id);
    }
  }

  public unregisterForm(formId: string): void {
    this.forms.delete(formId);
    this.configs.delete(formId);
    this.listeners.delete(formId);

    // Track form unregistration in analytics
    analyticsService.trackUserEvent({
      type: 'form_unregistered',
      userId: 'system',
      details: {
        formId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public setFieldValue(
    formId: string,
    name: string,
    value: any,
    validate: boolean = true
  ): void {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config) {
      return;
    }

    const field = form.fields[name] || {
      value: undefined,
      touched: false,
      dirty: false,
      errors: [],
      validating: false,
    };

    // Update field
    form.fields[name] = {
      ...field,
      value,
      dirty: true,
    };

    // Update form state
    form.pristine = false;

    // Notify listeners
    this.notifyFormListeners(formId);

    // Call onChange callback
    config.onChange?.(this.getValues(formId));

    // Validate field
    if (validate && config.validationSchema) {
      this.validateField(formId, name);
    }
  }

  public setFieldTouched(
    formId: string,
    name: string,
    touched: boolean = true
  ): void {
    const form = this.forms.get(formId);
    if (!form) {
      return;
    }

    const field = form.fields[name];
    if (!field) {
      return;
    }

    // Update field
    form.fields[name] = {
      ...field,
      touched,
    };

    // Update form touched state
    form.touched = Object.values(form.fields).some((f) => f.touched);

    // Notify listeners
    this.notifyFormListeners(formId);
  }

  public setErrors(formId: string, errors: Record<string, string[]>): void {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config) {
      return;
    }

    // Update field errors
    Object.entries(errors).forEach(([name, fieldErrors]) => {
      const field = form.fields[name];
      if (field) {
        form.fields[name] = {
          ...field,
          errors: fieldErrors,
        };
      }
    });

    // Update form error state
    form.errors = errors;
    form.isValid = Object.values(errors).every(
      (fieldErrors) => fieldErrors.length === 0
    );

    // Call onError callback
    config.onError?.(errors);

    // Notify listeners
    this.notifyFormListeners(formId);
  }

  public async validateField(formId: string, name: string): Promise<void> {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config || !config.validationSchema) {
      return;
    }

    const field = form.fields[name];
    if (!field) {
      return;
    }

    // Set field to validating state
    form.fields[name] = {
      ...field,
      validating: true,
    };
    this.notifyFormListeners(formId);

    try {
      // Perform validation
      const errors = await validationService.validateField(
        config.validationSchema,
        name,
        field.value
      );

      // Update field errors
      form.fields[name] = {
        ...form.fields[name],
        errors,
        validating: false,
      };

      // Update form error state
      form.errors = {
        ...form.errors,
        [name]: errors,
      };
      form.isValid = Object.values(form.errors).every(
        (fieldErrors) => fieldErrors.length === 0
      );

      // Notify listeners
      this.notifyFormListeners(formId);
    } catch (error) {
      console.error(`Validation error for field ${name}:`, error);
      form.fields[name] = {
        ...form.fields[name],
        validating: false,
      };
      this.notifyFormListeners(formId);
    }
  }

  public async validateForm(formId: string): Promise<boolean> {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config || !config.validationSchema) {
      return true;
    }

    try {
      // Perform validation
      const result = await validationService.validate(
        config.validationSchema,
        this.getValues(formId)
      );

      // Update form state
      this.setErrors(formId, result.errors);

      return result.isValid;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  }

  public async submitForm(formId: string): Promise<void> {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config) {
      return;
    }

    // Track form submission in analytics
    analyticsService.trackUserEvent({
      type: 'form_submitted',
      userId: 'system',
      details: {
        formId,
        timestamp: new Date().toISOString(),
      },
    });

    // Set submitting state
    form.isSubmitting = true;
    form.submitCount++;
    this.notifyFormListeners(formId);

    try {
      // Validate form
      const isValid = await this.validateForm(formId);
      if (!isValid) {
        throw new Error('Form validation failed');
      }

      // Submit form
      await config.onSubmit(this.getValues(formId));

      // Reset form
      this.resetForm(formId);
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        this.setErrors(formId, {
          form: [error.message],
        });
      }
    } finally {
      form.isSubmitting = false;
      this.notifyFormListeners(formId);
    }
  }

  public resetForm(formId: string): void {
    const form = this.forms.get(formId);
    const config = this.configs.get(formId);
    if (!form || !config) {
      return;
    }

    // Reset fields to initial values
    Object.entries(config.initialValues).forEach(([name, value]) => {
      form.fields[name] = {
        value,
        touched: false,
        dirty: false,
        errors: [],
        validating: false,
      };
    });

    // Reset form state
    form.isValid = true;
    form.isSubmitting = false;
    form.pristine = true;
    form.touched = false;
    form.errors = {};

    // Call onReset callback
    config.onReset?.();

    // Notify listeners
    this.notifyFormListeners(formId);

    // Track form reset in analytics
    analyticsService.trackUserEvent({
      type: 'form_reset',
      userId: 'system',
      details: {
        formId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public getFieldValue(formId: string, name: string): any {
    const form = this.forms.get(formId);
    return form?.fields[name]?.value;
  }

  public getFieldError(formId: string, name: string): string[] {
    const form = this.forms.get(formId);
    return form?.fields[name]?.errors || [];
  }

  public getValues(formId: string): Record<string, any> {
    const form = this.forms.get(formId);
    if (!form) {
      return {};
    }

    const values: Record<string, any> = {};
    Object.entries(form.fields).forEach(([name, field]) => {
      values[name] = field.value;
    });
    return values;
  }

  public getFormState(formId: string): FormState | undefined {
    return this.forms.get(formId);
  }

  public addFormListener(
    formId: string,
    listener: (state: FormState) => void
  ): () => void {
    const formListeners = this.listeners.get(formId);
    if (!formListeners) {
      return () => {};
    }

    formListeners.add(listener);
    const form = this.forms.get(formId);
    if (form) {
      listener(form);
    }

    return () => formListeners.delete(listener);
  }

  private notifyFormListeners(formId: string): void {
    const form = this.forms.get(formId);
    const formListeners = this.listeners.get(formId);
    if (!form || !formListeners) {
      return;
    }

    formListeners.forEach((listener) => listener(form));
  }
}

// Create a singleton instance
const formService = new FormService();

export default formService;
