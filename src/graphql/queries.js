/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCookingCoolingFormsByDateRange = /* GraphQL */ `
  query GetCookingCoolingFormsByDateRange(
    $startDate: AWSDateTime!
    $endDate: AWSDateTime!
  ) {
    getCookingCoolingFormsByDateRange(
      startDate: $startDate
      endDate: $endDate
    ) {
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
export const getTodaysCookingCoolingForms = /* GraphQL */ `
  query GetTodaysCookingCoolingForms {
    getTodaysCookingCoolingForms {
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
export const getCookingCoolingFormsByStatus = /* GraphQL */ `
  query GetCookingCoolingFormsByStatus($status: FormStatus!) {
    getCookingCoolingFormsByStatus(status: $status) {
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
export const getCookingCoolingFormsByInitial = /* GraphQL */ `
  query GetCookingCoolingFormsByInitial($initial: String!) {
    getCookingCoolingFormsByInitial(initial: $initial) {
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
export const getPiroshkiFormsByDateRange = /* GraphQL */ `
  query GetPiroshkiFormsByDateRange(
    $startDate: AWSDateTime!
    $endDate: AWSDateTime!
  ) {
    getPiroshkiFormsByDateRange(startDate: $startDate, endDate: $endDate) {
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
export const getTodaysPiroshkiForms = /* GraphQL */ `
  query GetTodaysPiroshkiForms {
    getTodaysPiroshkiForms {
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
export const getPiroshkiFormsByStatus = /* GraphQL */ `
  query GetPiroshkiFormsByStatus($status: FormStatus!) {
    getPiroshkiFormsByStatus(status: $status) {
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
export const getPiroshkiFormsByInitial = /* GraphQL */ `
  query GetPiroshkiFormsByInitial($initial: String!) {
    getPiroshkiFormsByInitial(initial: $initial) {
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
export const getBagelDogFormsByDateRange = /* GraphQL */ `
  query GetBagelDogFormsByDateRange(
    $startDate: AWSDateTime!
    $endDate: AWSDateTime!
  ) {
    getBagelDogFormsByDateRange(startDate: $startDate, endDate: $endDate) {
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
export const getTodaysBagelDogForms = /* GraphQL */ `
  query GetTodaysBagelDogForms {
    getTodaysBagelDogForms {
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
export const getBagelDogFormsByStatus = /* GraphQL */ `
  query GetBagelDogFormsByStatus($status: FormStatus!) {
    getBagelDogFormsByStatus(status: $status) {
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
export const getBagelDogFormsByInitial = /* GraphQL */ `
  query GetBagelDogFormsByInitial($initial: String!) {
    getBagelDogFormsByInitial(initial: $initial) {
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
export const getCookingCoolingFormEntry = /* GraphQL */ `
  query GetCookingCoolingFormEntry($id: ID!) {
    getCookingCoolingFormEntry(id: $id) {
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
export const listCookingCoolingFormEntries = /* GraphQL */ `
  query ListCookingCoolingFormEntries(
    $filter: ModelCookingCoolingFormEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCookingCoolingFormEntries(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        dateCreated
        lastTextEntry
        formInitial
        status
        title
        thermometerNumber
        ingredients
        lotNumbers
        correctiveActionsComments
        resolvedErrors
        completedAt
        approvedBy
        approvedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPiroshkiFormEntry = /* GraphQL */ `
  query GetPiroshkiFormEntry($id: ID!) {
    getPiroshkiFormEntry(id: $id) {
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
export const listPiroshkiFormEntries = /* GraphQL */ `
  query ListPiroshkiFormEntries(
    $filter: ModelPiroshkiFormEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPiroshkiFormEntries(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        dateCreated
        lastTextEntry
        formInitial
        status
        title
        thermometerNumber
        ingredients
        lotNumbers
        correctiveActionsComments
        quantityAndFlavor
        resolvedErrors
        completedAt
        approvedBy
        approvedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getBagelDogFormEntry = /* GraphQL */ `
  query GetBagelDogFormEntry($id: ID!) {
    getBagelDogFormEntry(id: $id) {
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
export const listBagelDogFormEntries = /* GraphQL */ `
  query ListBagelDogFormEntries(
    $filter: ModelBagelDogFormEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBagelDogFormEntries(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        dateCreated
        lastTextEntry
        formInitial
        status
        title
        thermometerNumber
        ingredients
        lotNumbers
        correctiveActionsComments
        frankFlavorSizeTable
        resolvedErrors
        completedAt
        approvedBy
        approvedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
