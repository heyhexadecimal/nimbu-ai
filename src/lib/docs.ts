import { google } from 'googleapis'

export interface DocSearchResult {
    id: string
    name: string
    mimeType: string
    createdTime: string
    modifiedTime: string
    webViewLink: string
    owners: Array<{ displayName: string; emailAddress: string }>
    permissions?: Array<{ type: string; role: string; emailAddress?: string }>
}

export interface DocContent {
    id: string
    title: string
    content: string
    wordCount: number
    lastModified: string
}

export interface DocPermission {
    id?: string
    type: 'user' | 'group' | 'domain' | 'anyone'
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'
    emailAddress?: string
    domain?: string
}

function getDriveClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.drive({ version: 'v3', auth })
}

function getDocsClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.docs({ version: 'v1', auth })
}

// Search for documents by title or content
export async function searchDocuments(
    accessToken: string,
    searchQuery: string,
    maxResults: number = 20
): Promise<DocSearchResult[]> {
    try {
        const drive = getDriveClient(accessToken)

        // Search for Google Docs specifically
        const query = `mimeType='application/vnd.google-apps.document' and (name contains '${searchQuery}' or fullText contains '${searchQuery}') and trashed=false`

        const response = await drive.files.list({
            q: query,
            pageSize: maxResults,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,owners)',
            orderBy: 'modifiedTime desc'
        })

        const files = response.data.files || []

        return files.map(file => ({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            createdTime: file.createdTime!,
            modifiedTime: file.modifiedTime!,
            webViewLink: file.webViewLink!,
            owners: file.owners || []
        }))
    } catch (error) {
        console.error('Error searching documents:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to search documents: ${error.message}`)
        } else {
            throw new Error('Failed to search documents: Unknown error')
        }
    }
}

// Get document content by ID
export async function getDocumentContent(
    accessToken: string,
    documentId: string
): Promise<DocContent> {
    try {
        const docs = getDocsClient(accessToken)

        const response = await docs.documents.get({
            documentId: documentId
        })

        const document = response.data
        let content = ''
        let wordCount = 0

        // Extract text content from the document structure
        if (document.body?.content) {
            content = extractTextFromContent(document.body.content)
            wordCount = content.split(/\s+/).filter(word => word.length > 0).length
        }

        return {
            id: documentId,
            title: document.title || 'Untitled Document',
            content: content,
            wordCount: wordCount,
            lastModified: document.revisionId || 'Unknown'
        }
    } catch (error) {
        console.error('Error getting document content:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to get document content: ${error.message}`)
        } else {
            throw new Error('Failed to get document content: Unknown error')
        }
    }
}

// Create a new document
export async function createDocument(
    accessToken: string,
    title: string,
    content?: string
): Promise<{ success: boolean; documentId: string; webViewLink: string }> {
    try {
        const docs = getDocsClient(accessToken)

        // Create the document
        const response = await docs.documents.create({
            requestBody: {
                title: title
            }
        })

        const documentId = response.data.documentId!

        // Add initial content if provided
        if (content && content.trim()) {
            await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: [
                        {
                            insertText: {
                                location: {
                                    index: 1
                                },
                                text: content
                            }
                        }
                    ]
                }
            })
        }

        // Get the web view link
        const drive = getDriveClient(accessToken)
        const fileResponse = await drive.files.get({
            fileId: documentId,
            fields: 'webViewLink'
        })

        return {
            success: true,
            documentId: documentId,
            webViewLink: fileResponse.data.webViewLink!
        }
    } catch (error) {
        console.error('Error creating document:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to create document: ${error.message}`)
        } else {
            throw new Error('Failed to create document: Unknown error')
        }
    }
}

// Update document content
export async function updateDocumentContent(
    accessToken: string,
    documentId: string,
    content: string,
    insertAtEnd: boolean = true
): Promise<{ success: boolean }> {
    try {
        const docs = getDocsClient(accessToken)

        let insertIndex = 1 // Beginning of document

        if (insertAtEnd) {
            // Get current document to find end index
            const currentDoc = await docs.documents.get({ documentId })
            const bodyContent = currentDoc.data.body?.content || []
            insertIndex = bodyContent[bodyContent.length - 1]?.endIndex || 1
        }

        await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: {
                                index: insertIndex
                            },
                            text: insertAtEnd ? `\n\n${content}` : content
                        }
                    }
                ]
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error updating document:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to update document: ${error.message}`)
        } else {
            throw new Error('Failed to update document: Unknown error')
        }
    }
}

// Get document permissions
export async function getDocumentPermissions(
    accessToken: string,
    documentId: string
): Promise<DocPermission[]> {
    try {
        const drive = getDriveClient(accessToken)

        const response = await drive.permissions.list({
            fileId: documentId,
            fields: 'permissions(id,type,role,emailAddress,domain)'
        })

        const permissions = response.data.permissions || []

        return permissions.map(permission => ({
            id: permission.id!,
            type: permission.type as DocPermission['type'],
            role: permission.role as DocPermission['role'],
            emailAddress: permission.emailAddress,
            domain: permission.domain
        }))
    } catch (error) {
        console.error('Error getting document permissions:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to get document permissions: ${error.message}`)
        } else {
            throw new Error('Failed to get document permissions: Unknown error')
        }
    }
}

// Add permission to document
export async function addDocumentPermission(
    accessToken: string,
    documentId: string,
    permission: Omit<DocPermission, 'id'>,
    sendNotificationEmail: boolean = true
): Promise<{ success: boolean; permissionId: string }> {
    try {
        const drive = getDriveClient(accessToken)

        const response = await drive.permissions.create({
            fileId: documentId,
            sendNotificationEmail: sendNotificationEmail,
            requestBody: {
                type: permission.type,
                role: permission.role,
                emailAddress: permission.emailAddress,
                domain: permission.domain
            }
        })

        return {
            success: true,
            permissionId: response.data.id!
        }
    } catch (error) {
        console.error('Error adding document permission:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to add document permission: ${error.message}`)
        } else {
            throw new Error('Failed to add document permission: Unknown error')
        }
    }
}

// Remove permission from document
export async function removeDocumentPermission(
    accessToken: string,
    documentId: string,
    permissionId: string
): Promise<{ success: boolean }> {
    try {
        const drive = getDriveClient(accessToken)

        await drive.permissions.delete({
            fileId: documentId,
            permissionId: permissionId
        })

        return { success: true }
    } catch (error) {
        console.error('Error removing document permission:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to remove document permission: ${error.message}`)
        } else {
            throw new Error('Failed to remove document permission: Unknown error')
        }
    }
}

// Update document title
export async function updateDocumentTitle(
    accessToken: string,
    documentId: string,
    newTitle: string
): Promise<{ success: boolean }> {
    try {
        const drive = getDriveClient(accessToken)

        await drive.files.update({
            fileId: documentId,
            requestBody: {
                name: newTitle
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error updating document title:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to update document title: ${error.message}`)
        } else {
            throw new Error('Failed to update document title: Unknown error')
        }
    }
}

// Helper function to extract text from Google Docs content structure
function extractTextFromContent(content: any[]): string {
    let text = ''

    for (const element of content) {
        if (element.paragraph) {
            const paragraph = element.paragraph
            if (paragraph.elements) {
                for (const elem of paragraph.elements) {
                    if (elem.textRun) {
                        text += elem.textRun.content || ''
                    }
                }
            }
        } else if (element.table) {
            // Handle table content
            const table = element.table
            if (table.tableRows) {
                for (const row of table.tableRows) {
                    if (row.tableCells) {
                        for (const cell of row.tableCells) {
                            if (cell.content) {
                                text += extractTextFromContent(cell.content) + '\t'
                            }
                        }
                        text += '\n'
                    }
                }
            }
        }
    }

    return text
}

// Get user's recent documents
export async function getRecentDocuments(
    accessToken: string,
    maxResults: number = 10
): Promise<DocSearchResult[]> {
    try {
        const drive = getDriveClient(accessToken)

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.document' and trashed=false",
            pageSize: maxResults,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,owners)',
            orderBy: 'modifiedTime desc'
        })

        const files = response.data.files || []

        return files.map(file => ({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            createdTime: file.createdTime!,
            modifiedTime: file.modifiedTime!,
            webViewLink: file.webViewLink!,
            owners: file.owners || []
        }))
    } catch (error) {
        console.error('Error getting recent documents:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please reconnect your account.');
            }
            throw new Error(`Failed to get recent documents: ${error.message}`)
        } else {
            throw new Error('Failed to get recent documents: Unknown error')
        }
    }
}