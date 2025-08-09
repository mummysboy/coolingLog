/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onLogEntryCreated = /* GraphQL */ `
  subscription OnLogEntryCreated {
    onLogEntryCreated {
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
export const onLogEntryUpdated = /* GraphQL */ `
  subscription OnLogEntryUpdated {
    onLogEntryUpdated {
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
export const onLogEntrySubmittedForReview = /* GraphQL */ `
  subscription OnLogEntrySubmittedForReview {
    onLogEntrySubmittedForReview {
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
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
    onCreateUser(filter: $filter) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
    onUpdateUser(filter: $filter) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
    onDeleteUser(filter: $filter) {
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
export const onCreateLogEntry = /* GraphQL */ `
  subscription OnCreateLogEntry($filter: ModelSubscriptionLogEntryFilterInput) {
    onCreateLogEntry(filter: $filter) {
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
export const onUpdateLogEntry = /* GraphQL */ `
  subscription OnUpdateLogEntry($filter: ModelSubscriptionLogEntryFilterInput) {
    onUpdateLogEntry(filter: $filter) {
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
export const onDeleteLogEntry = /* GraphQL */ `
  subscription OnDeleteLogEntry($filter: ModelSubscriptionLogEntryFilterInput) {
    onDeleteLogEntry(filter: $filter) {
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
export const onCreateInitialEntry = /* GraphQL */ `
  subscription OnCreateInitialEntry(
    $filter: ModelSubscriptionInitialEntryFilterInput
  ) {
    onCreateInitialEntry(filter: $filter) {
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
export const onUpdateInitialEntry = /* GraphQL */ `
  subscription OnUpdateInitialEntry(
    $filter: ModelSubscriptionInitialEntryFilterInput
  ) {
    onUpdateInitialEntry(filter: $filter) {
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
export const onDeleteInitialEntry = /* GraphQL */ `
  subscription OnDeleteInitialEntry(
    $filter: ModelSubscriptionInitialEntryFilterInput
  ) {
    onDeleteInitialEntry(filter: $filter) {
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
