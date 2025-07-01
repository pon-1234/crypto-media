/**
 * HubSpotフォームライブラリの型定義
 * @doc https://developers.hubspot.com/docs/methods/forms/advanced_form_options
 * @issue #13 - HubSpotフォーム統合
 */

interface HubSpotFormConfig {
  portalId: string
  formId: string
  target: string
  onFormSubmitted?: () => void
  onFormSubmitError?: (error: unknown) => void
}

interface HubSpotForms {
  create: (config: HubSpotFormConfig) => void
}

interface HubSpot {
  forms: HubSpotForms
}

interface Window {
  hbspt?: HubSpot
}
