/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const updateCookingCoolingFormStatus = /* GraphQL */ `
  mutation UpdateCookingCoolingFormStatus($formId: ID!, $status: FormStatus!) {
    updateCookingCoolingFormStatus(formId: $formId, status: $status) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const addAdminComment = /* GraphQL */ `
  mutation AddAdminComment($formId: ID!, $comment: AdminCommentInput!) {
    addAdminComment(formId: $formId, comment: $comment) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const resolveError = /* GraphQL */ `
  mutation ResolveError($formId: ID!, $errorId: String!) {
    resolveError(formId: $formId, errorId: $errorId) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updatePiroshkiFormStatus = /* GraphQL */ `
  mutation UpdatePiroshkiFormStatus($formId: ID!, $status: FormStatus!) {
    updatePiroshkiFormStatus(formId: $formId, status: $status) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const addPiroshkiAdminComment = /* GraphQL */ `
  mutation AddPiroshkiAdminComment($formId: ID!, $comment: AdminCommentInput!) {
    addPiroshkiAdminComment(formId: $formId, comment: $comment) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const resolvePiroshkiError = /* GraphQL */ `
  mutation ResolvePiroshkiError($formId: ID!, $errorId: String!) {
    resolvePiroshkiError(formId: $formId, errorId: $errorId) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateBagelDogFormStatus = /* GraphQL */ `
  mutation UpdateBagelDogFormStatus($formId: ID!, $status: FormStatus!) {
    updateBagelDogFormStatus(formId: $formId, status: $status) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const addBagelDogAdminComment = /* GraphQL */ `
  mutation AddBagelDogAdminComment($formId: ID!, $comment: AdminCommentInput!) {
    addBagelDogAdminComment(formId: $formId, comment: $comment) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const resolveBagelDogError = /* GraphQL */ `
  mutation ResolveBagelDogError($formId: ID!, $errorId: String!) {
    resolveBagelDogError(formId: $formId, errorId: $errorId) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createCookingCoolingFormEntry = /* GraphQL */ `
  mutation CreateCookingCoolingFormEntry(
    $input: CreateCookingCoolingFormEntryInput!
    $condition: ModelCookingCoolingFormEntryConditionInput
  ) {
    createCookingCoolingFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateCookingCoolingFormEntry = /* GraphQL */ `
  mutation UpdateCookingCoolingFormEntry(
    $input: UpdateCookingCoolingFormEntryInput!
    $condition: ModelCookingCoolingFormEntryConditionInput
  ) {
    updateCookingCoolingFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteCookingCoolingFormEntry = /* GraphQL */ `
  mutation DeleteCookingCoolingFormEntry(
    $input: DeleteCookingCoolingFormEntryInput!
    $condition: ModelCookingCoolingFormEntryConditionInput
  ) {
    deleteCookingCoolingFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createPiroshkiFormEntry = /* GraphQL */ `
  mutation CreatePiroshkiFormEntry(
    $input: CreatePiroshkiFormEntryInput!
    $condition: ModelPiroshkiFormEntryConditionInput
  ) {
    createPiroshkiFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updatePiroshkiFormEntry = /* GraphQL */ `
  mutation UpdatePiroshkiFormEntry(
    $input: UpdatePiroshkiFormEntryInput!
    $condition: ModelPiroshkiFormEntryConditionInput
  ) {
    updatePiroshkiFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deletePiroshkiFormEntry = /* GraphQL */ `
  mutation DeletePiroshkiFormEntry(
    $input: DeletePiroshkiFormEntryInput!
    $condition: ModelPiroshkiFormEntryConditionInput
  ) {
    deletePiroshkiFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      quantityAndFlavor
      preShipmentReview {
        date
        initials
        results
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createBagelDogFormEntry = /* GraphQL */ `
  mutation CreateBagelDogFormEntry(
    $input: CreateBagelDogFormEntryInput!
    $condition: ModelBagelDogFormEntryConditionInput
  ) {
    createBagelDogFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateBagelDogFormEntry = /* GraphQL */ `
  mutation UpdateBagelDogFormEntry(
    $input: UpdateBagelDogFormEntryInput!
    $condition: ModelBagelDogFormEntryConditionInput
  ) {
    updateBagelDogFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteBagelDogFormEntry = /* GraphQL */ `
  mutation DeleteBagelDogFormEntry(
    $input: DeleteBagelDogFormEntryInput!
    $condition: ModelBagelDogFormEntryConditionInput
  ) {
    deleteBagelDogFormEntry(input: $input, condition: $condition) {
      id
      date
      dateCreated
      lastTextEntry
      formInitial
      status
      title
      entries {
        type
        rack
        __typename
        __typename
      }
      thermometerNumber
      ingredients
      lotNumbers
      correctiveActionsComments
      frankFlavorSizeTable
      bagelDogPreShipmentReview {
        date
        results
        signature
        __typename
      }
      adminComments {
        id
        adminInitial
        timestamp
        comment
        __typename
      }
      resolvedErrors
      createdAt
      updatedAt
      __typename
    }
  }
`;
