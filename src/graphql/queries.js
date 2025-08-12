/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getLogsByDateRange = /* GraphQL */ `
  query GetLogsByDateRange($startDate: AWSDateTime!, $endDate: AWSDateTime!) {
    getLogsByDateRange(startDate: $startDate, endDate: $endDate) {
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
export const getTodaysLogs = /* GraphQL */ `
  query GetTodaysLogs {
    getTodaysLogs {
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
export const getLogsRequiringReview = /* GraphQL */ `
  query GetLogsRequiringReview {
    getLogsRequiringReview {
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
export const getLogsByEmployee = /* GraphQL */ `
  query GetLogsByEmployee($employeeId: ID!) {
    getLogsByEmployee(employeeId: $employeeId) {
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
export const getLogsByShift = /* GraphQL */ `
  query GetLogsByShift($shift: Shift!) {
    getLogsByShift(shift: $shift) {
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
export const getPaperFormsByDateRange = /* GraphQL */ `
  query GetPaperFormsByDateRange(
    $startDate: AWSDateTime!
    $endDate: AWSDateTime!
  ) {
    getPaperFormsByDateRange(startDate: $startDate, endDate: $endDate) {
      id
      date
      formType
      formInitial
      status
      title
      entries {
        type
        __typename
      }
      thermometerNumber
      ingredients {
        beef
        chicken
        liquidEggs
        __typename
      }
      lotNumbers {
        beef
        chicken
        liquidEggs
        __typename
      }
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
export const getTodaysPaperForms = /* GraphQL */ `
  query GetTodaysPaperForms {
    getTodaysPaperForms {
      id
      date
      formType
      formInitial
      status
      title
      entries {
        type
        __typename
      }
      thermometerNumber
      ingredients {
        beef
        chicken
        liquidEggs
        __typename
      }
      lotNumbers {
        beef
        chicken
        liquidEggs
        __typename
      }
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
export const getPaperFormsByStatus = /* GraphQL */ `
  query GetPaperFormsByStatus($status: FormStatus!) {
    getPaperFormsByStatus(status: $status) {
      id
      date
      formType
      formInitial
      status
      title
      entries {
        type
        __typename
      }
      thermometerNumber
      ingredients {
        beef
        chicken
        liquidEggs
        __typename
      }
      lotNumbers {
        beef
        chicken
        liquidEggs
        __typename
      }
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
export const getPaperFormsByInitial = /* GraphQL */ `
  query GetPaperFormsByInitial($initial: String!) {
    getPaperFormsByInitial(initial: $initial) {
      id
      date
      formType
      formInitial
      status
      title
      entries {
        type
        __typename
      }
      thermometerNumber
      ingredients {
        beef
        chicken
        liquidEggs
        __typename
      }
      lotNumbers {
        beef
        chicken
        liquidEggs
        __typename
      }
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
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
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
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getPaperFormEntry = /* GraphQL */ `
  query GetPaperFormEntry($id: ID!) {
    getPaperFormEntry(id: $id) {
      id
      date
      formType
      formInitial
      status
      title
      entries {
        type
        __typename
      }
      thermometerNumber
      ingredients {
        beef
        chicken
        liquidEggs
        __typename
      }
      lotNumbers {
        beef
        chicken
        liquidEggs
        __typename
      }
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
export const listPaperFormEntries = /* GraphQL */ `
  query ListPaperFormEntries(
    $filter: ModelPaperFormEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPaperFormEntries(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        date
        formType
        formInitial
        status
        title
        thermometerNumber
        correctiveActionsComments
        resolvedErrors
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getLogEntry = /* GraphQL */ `
  query GetLogEntry($id: ID!) {
    getLogEntry(id: $id) {
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
export const listLogEntries = /* GraphQL */ `
  query ListLogEntries(
    $filter: ModelLogEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLogEntries(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getInitialEntry = /* GraphQL */ `
  query GetInitialEntry($id: ID!) {
    getInitialEntry(id: $id) {
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
export const listInitialEntries = /* GraphQL */ `
  query ListInitialEntries(
    $filter: ModelInitialEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInitialEntries(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        initials
        name
        isActive
        createdBy
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const logEntriesByEmployeeId = /* GraphQL */ `
  query LogEntriesByEmployeeId(
    $employeeId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelLogEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    logEntriesByEmployeeId(
      employeeId: $employeeId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
