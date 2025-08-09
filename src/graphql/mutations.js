/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const updateLogEntryStage = /* GraphQL */ `
  mutation UpdateLogEntryStage(
    $logEntryId: ID!
    $stage: StageType!
    $stageData: StageDataInput!
  ) {
    updateLogEntryStage(
      logEntryId: $logEntryId
      stage: $stage
      stageData: $stageData
    ) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const submitLogEntryForReview = /* GraphQL */ `
  mutation SubmitLogEntryForReview($logEntryId: ID!) {
    submitLogEntryForReview(logEntryId: $logEntryId) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const approveLogEntry = /* GraphQL */ `
  mutation ApproveLogEntry(
    $logEntryId: ID!
    $adminComments: String
    $adminSignature: String
  ) {
    approveLogEntry(
      logEntryId: $logEntryId
      adminComments: $adminComments
      adminSignature: $adminSignature
    ) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const addCorrectiveAction = /* GraphQL */ `
  mutation AddCorrectiveAction(
    $logEntryId: ID!
    $stage: StageType!
    $action: String!
    $employeeInitials: String!
  ) {
    addCorrectiveAction(
      logEntryId: $logEntryId
      stage: $stage
      action: $action
      employeeInitials: $employeeInitials
    ) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
      initials
      name
      role
      certificationNumber
      email
      isActive
      createdAt
      updatedAt
      logEntries {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
      id
      initials
      name
      role
      certificationNumber
      email
      isActive
      createdAt
      updatedAt
      logEntries {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
      id
      initials
      name
      role
      certificationNumber
      email
      isActive
      createdAt
      updatedAt
      logEntries {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const createLogEntry = /* GraphQL */ `
  mutation CreateLogEntry(
    $input: CreateLogEntryInput!
    $condition: ModelLogEntryConditionInput
  ) {
    createLogEntry(input: $input, condition: $condition) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateLogEntry = /* GraphQL */ `
  mutation UpdateLogEntry(
    $input: UpdateLogEntryInput!
    $condition: ModelLogEntryConditionInput
  ) {
    updateLogEntry(input: $input, condition: $condition) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteLogEntry = /* GraphQL */ `
  mutation DeleteLogEntry(
    $input: DeleteLogEntryInput!
    $condition: ModelLogEntryConditionInput
  ) {
    deleteLogEntry(input: $input, condition: $condition) {
      id
      date
      shift
      product
      productCode
      supplier
      receivedDate
      expirationDate
      thermometerNumber
      lotNumber
      batchSize
      packagingType
      employeeId
      employeeName
      employeeInitials
      supervisorInitials
      employee {
        id
        initials
        name
        role
        certificationNumber
        email
        isActive
        createdAt
        updatedAt
        __typename
      }
      cookStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      startCoolingStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to80Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      to54Stage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      finalChillStage {
        temperature
        time
        isValid
        correctiveAction
        employeeInitials
        notes
        __typename
      }
      ccp1Verified
      ccp2Verified
      monitoringCompleted
      correctiveActionsDocumented
      visualInspectionColor
      visualInspectionTexture
      visualInspectionOdor
      visualInspectionNotes
      storageLocation
      storageTemperature
      storageTime
      currentStage
      isComplete
      requiresReview
      isApproved
      adminComments
      reviewedBy
      reviewDate
      complianceIssues
      riskLevel
      employeeSignature
      supervisorSignature
      adminSignature
      completedAt
      submittedAt
      photos
      attachments
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createInitialEntry = /* GraphQL */ `
  mutation CreateInitialEntry(
    $input: CreateInitialEntryInput!
    $condition: ModelInitialEntryConditionInput
  ) {
    createInitialEntry(input: $input, condition: $condition) {
      id
      initials
      name
      isActive
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateInitialEntry = /* GraphQL */ `
  mutation UpdateInitialEntry(
    $input: UpdateInitialEntryInput!
    $condition: ModelInitialEntryConditionInput
  ) {
    updateInitialEntry(input: $input, condition: $condition) {
      id
      initials
      name
      isActive
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteInitialEntry = /* GraphQL */ `
  mutation DeleteInitialEntry(
    $input: DeleteInitialEntryInput!
    $condition: ModelInitialEntryConditionInput
  ) {
    deleteInitialEntry(input: $input, condition: $condition) {
      id
      initials
      name
      isActive
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
