/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCookingCoolingFormEntryCreated = /* GraphQL */ `
  subscription OnCookingCoolingFormEntryCreated {
    onCookingCoolingFormEntryCreated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCookingCoolingFormEntryUpdated = /* GraphQL */ `
  subscription OnCookingCoolingFormEntryUpdated {
    onCookingCoolingFormEntryUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCookingCoolingFormStatusUpdated = /* GraphQL */ `
  subscription OnCookingCoolingFormStatusUpdated {
    onCookingCoolingFormStatusUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onPiroshkiFormEntryCreated = /* GraphQL */ `
  subscription OnPiroshkiFormEntryCreated {
    onPiroshkiFormEntryCreated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onPiroshkiFormEntryUpdated = /* GraphQL */ `
  subscription OnPiroshkiFormEntryUpdated {
    onPiroshkiFormEntryUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onPiroshkiFormStatusUpdated = /* GraphQL */ `
  subscription OnPiroshkiFormStatusUpdated {
    onPiroshkiFormStatusUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onBagelDogFormEntryCreated = /* GraphQL */ `
  subscription OnBagelDogFormEntryCreated {
    onBagelDogFormEntryCreated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onBagelDogFormEntryUpdated = /* GraphQL */ `
  subscription OnBagelDogFormEntryUpdated {
    onBagelDogFormEntryUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onBagelDogFormStatusUpdated = /* GraphQL */ `
  subscription OnBagelDogFormStatusUpdated {
    onBagelDogFormStatusUpdated {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateCookingCoolingFormEntry = /* GraphQL */ `
  subscription OnCreateCookingCoolingFormEntry(
    $filter: ModelSubscriptionCookingCoolingFormEntryFilterInput
  ) {
    onCreateCookingCoolingFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateCookingCoolingFormEntry = /* GraphQL */ `
  subscription OnUpdateCookingCoolingFormEntry(
    $filter: ModelSubscriptionCookingCoolingFormEntryFilterInput
  ) {
    onUpdateCookingCoolingFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteCookingCoolingFormEntry = /* GraphQL */ `
  subscription OnDeleteCookingCoolingFormEntry(
    $filter: ModelSubscriptionCookingCoolingFormEntryFilterInput
  ) {
    onDeleteCookingCoolingFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePiroshkiFormEntry = /* GraphQL */ `
  subscription OnCreatePiroshkiFormEntry(
    $filter: ModelSubscriptionPiroshkiFormEntryFilterInput
  ) {
    onCreatePiroshkiFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdatePiroshkiFormEntry = /* GraphQL */ `
  subscription OnUpdatePiroshkiFormEntry(
    $filter: ModelSubscriptionPiroshkiFormEntryFilterInput
  ) {
    onUpdatePiroshkiFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeletePiroshkiFormEntry = /* GraphQL */ `
  subscription OnDeletePiroshkiFormEntry(
    $filter: ModelSubscriptionPiroshkiFormEntryFilterInput
  ) {
    onDeletePiroshkiFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateBagelDogFormEntry = /* GraphQL */ `
  subscription OnCreateBagelDogFormEntry(
    $filter: ModelSubscriptionBagelDogFormEntryFilterInput
  ) {
    onCreateBagelDogFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateBagelDogFormEntry = /* GraphQL */ `
  subscription OnUpdateBagelDogFormEntry(
    $filter: ModelSubscriptionBagelDogFormEntryFilterInput
  ) {
    onUpdateBagelDogFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteBagelDogFormEntry = /* GraphQL */ `
  subscription OnDeleteBagelDogFormEntry(
    $filter: ModelSubscriptionBagelDogFormEntryFilterInput
  ) {
    onDeleteBagelDogFormEntry(filter: $filter) {
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
      completedAt
      approvedBy
      approvedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
