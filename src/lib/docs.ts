import { StructuredTool } from "@langchain/core/tools";
import { google } from "googleapis";
import { z } from "zod";

function getDocsClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.docs({ version: 'v1', auth })
}

function getDriveClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.drive({ version: 'v3', auth })
}

export class GoogleDocsCreateDocument extends StructuredTool {
    name = "google_docs_create_document";
    description = "Create a new Google Doc with optional initial content";
    private docs;
    private drive;

    schema = z.object({
        title: z.string().describe("Title of the new document"),
        content: z.string().optional().describe("Initial text content for the document"),
        folderId: z.string().optional().describe("Google Drive folder ID to create the document in"),
    });

    constructor(private accessToken: string) {
        super();
        this.docs = getDocsClient(this.accessToken);
        this.drive = getDriveClient(this.accessToken);
    }

    async _call({ title, content, folderId }: z.infer<typeof this.schema>) {
        try {
            const createResponse = await this.docs.documents.create({
                requestBody: {
                    title: title
                }
            });

            const documentId = createResponse.data.documentId;

            if (content) {
                await this.docs.documents.batchUpdate({
                    documentId: documentId!,
                    requestBody: {
                        requests: [{
                            insertText: {
                                location: {
                                    index: 1
                                },
                                text: content
                            }
                        }]
                    }
                });
            }

            if (folderId) {
                await this.drive.files.update({
                    fileId: documentId!,
                    addParents: folderId,
                    fields: 'id, parents'
                });
            }

            return {
                success: true,
                documentId: documentId,
                title: title,
                documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
            };
        } catch (err: any) {
            return `Failed to create document: ${err.message}`;
        }
    }
}

export class GoogleDocsReadDocument extends StructuredTool {
    name = "google_docs_read_document";
    description = "Read the content of a Google Doc. Returns the full text content and document structure.";
    private docs;

    schema = z.object({
        documentId: z.string().describe("The ID of the Google Doc to read"),
        includeStructure: z.boolean().optional().default(false).describe("Whether to include detailed document structure information")
    });

    constructor(private accessToken: string) {
        super();
        this.docs = getDocsClient(this.accessToken);
    }

    async _call({ documentId, includeStructure }: z.infer<typeof this.schema>) {
        try {
            const response = await this.docs.documents.get({
                documentId: documentId
            });

            const document = response.data;

            let textContent = '';
            if (document.body?.content) {
                for (const element of document.body.content) {
                    if (element.paragraph?.elements) {
                        for (const elem of element.paragraph.elements) {
                            if (elem.textRun?.content) {
                                textContent += elem.textRun.content;
                            }
                        }
                    }
                }
            }

            const result: any = {
                success: true,
                documentId: document.documentId,
                title: document.title,
                textContent: textContent,
                documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
            };

            if (includeStructure) {
                result.structure = {
                    body: document.body,
                    namedStyles: document.namedStyles,
                    lists: document.lists,
                    revisionId: document.revisionId
                };
            }

            return result;
        } catch (err: any) {
            return `Failed to read document: ${err.message}`;
        }
    }
}

export class GoogleDocsUpdateDocument extends StructuredTool {
    name = "google_docs_update_document";
    description = "Update a Google Doc by appending, inserting, or replacing text content";
    private docs;

    schema = z.object({
        documentId: z.string().describe("The ID of the Google Doc to update"),
        action: z.enum(['append', 'replace', 'insert']).describe("Type of update action"),
        content: z.string().describe("The text content to add/replace"),
        replaceText: z.string().optional().describe("For 'replace' action: the text to find and replace"),
        insertIndex: z.number().optional().describe("For 'insert' action: the index position to insert text at (1 is the beginning)")
    });

    constructor(private accessToken: string) {
        super();
        this.docs = getDocsClient(this.accessToken);
    }

    async _call({ documentId, action, content, replaceText, insertIndex }: z.infer<typeof this.schema>) {
        try {
            let requests: any[] = [];

            if (action === 'append') {
                const doc = await this.docs.documents.get({ documentId });
                const endIndex = doc.data.body?.content?.slice(-1)[0]?.endIndex || 1;

                requests = [{
                    insertText: {
                        location: {
                            index: endIndex - 1
                        },
                        text: content
                    }
                }];
            } else if (action === 'replace' && replaceText) {
                requests = [{
                    replaceAllText: {
                        containsText: {
                            text: replaceText,
                            matchCase: true
                        },
                        replaceText: content
                    }
                }];
            } else if (action === 'insert') {
                const index = insertIndex || 1;
                requests = [{
                    insertText: {
                        location: {
                            index: index
                        },
                        text: content
                    }
                }];
            }

            const response = await this.docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: requests
                }
            });

            return {
                success: true,
                documentId: documentId,
                action: action,
                replies: response.data.replies,
                documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
            };
        } catch (err: any) {
            return `Failed to update document: ${err.message}`;
        }
    }
}

export class GoogleDocsFormatDocument extends StructuredTool {
    name = "google_docs_format_document";
    description = "Apply formatting to text in a Google Doc (bold, italic, underline, font size, color, etc.)";
    private docs;

    schema = z.object({
        documentId: z.string().describe("The ID of the Google Doc to format"),
        startIndex: z.number().describe("Start index of the text range to format"),
        endIndex: z.number().describe("End index of the text range to format"),
        bold: z.boolean().optional().describe("Make text bold"),
        italic: z.boolean().optional().describe("Make text italic"),
        underline: z.boolean().optional().describe("Underline text"),
        fontSize: z.number().optional().describe("Font size in points"),
        fontFamily: z.string().optional().describe("Font family name"),
        foregroundColor: z.object({
            red: z.number().min(0).max(1).optional(),
            green: z.number().min(0).max(1).optional(),
            blue: z.number().min(0).max(1).optional()
        }).optional().describe("Text color (RGB values between 0 and 1)"),
        backgroundColor: z.object({
            red: z.number().min(0).max(1).optional(),
            green: z.number().min(0).max(1).optional(),
            blue: z.number().min(0).max(1).optional()
        }).optional().describe("Background color (RGB values between 0 and 1)")
    });

    constructor(private accessToken: string) {
        super();
        this.docs = getDocsClient(this.accessToken);
    }

    async _call({
        documentId,
        startIndex,
        endIndex,
        bold,
        italic,
        underline,
        fontSize,
        fontFamily,
        foregroundColor,
        backgroundColor
    }: z.infer<typeof this.schema>) {
        try {
            const textStyle: any = {};

            if (bold !== undefined) textStyle.bold = bold;
            if (italic !== undefined) textStyle.italic = italic;
            if (underline !== undefined) textStyle.underline = underline;
            if (fontSize) {
                textStyle.fontSize = {
                    magnitude: fontSize,
                    unit: 'PT'
                };
            }
            if (fontFamily) {
                textStyle.weightedFontFamily = {
                    fontFamily: fontFamily
                };
            }
            if (foregroundColor) {
                textStyle.foregroundColor = {
                    color: {
                        rgbColor: foregroundColor
                    }
                };
            }
            if (backgroundColor) {
                textStyle.backgroundColor = {
                    color: {
                        rgbColor: backgroundColor
                    }
                };
            }

            const response = await this.docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: [{
                        updateTextStyle: {
                            range: {
                                startIndex: startIndex,
                                endIndex: endIndex
                            },
                            textStyle: textStyle,
                            fields: Object.keys(textStyle).join(',')
                        }
                    }]
                }
            });

            return {
                success: true,
                documentId: documentId,
                formattedRange: { startIndex, endIndex },
                appliedStyles: textStyle,
                documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
            };
        } catch (err: any) {
            return `Failed to format document: ${err.message}`;
        }
    }
}

export class GoogleDocsSearchDocuments extends StructuredTool {
    name = "google_docs_search_documents";
    description = "Search for Google Docs in the user's Drive by name, content, or other criteria";
    private drive;

    schema = z.object({
        query: z.string().optional().describe("Search query for document name or content"),
        folderId: z.string().optional().describe("Limit search to a specific folder"),
        modifiedAfter: z.string().optional().describe("Find documents modified after this date (ISO string)"),
        maxResults: z.number().optional().default(10).describe("Maximum number of results to return"),
        orderBy: z.enum(['modifiedTime', 'name', 'createdTime']).optional().default('modifiedTime').describe("How to sort the results")
    });

    constructor(private accessToken: string) {
        super();
        this.drive = getDriveClient(this.accessToken);
    }

    async _call({ query, folderId, modifiedAfter, maxResults, orderBy }: z.infer<typeof this.schema>) {
        try {
            let q = "mimeType='application/vnd.google-apps.document'";

            if (query) {
                q += ` and (name contains '${query}' or fullText contains '${query}')`;
            }

            if (folderId) {
                q += ` and '${folderId}' in parents`;
            }

            if (modifiedAfter) {
                q += ` and modifiedTime > '${modifiedAfter}'`;
            }

            const response = await this.drive.files.list({
                q: q,
                pageSize: maxResults,
                orderBy: orderBy,
                fields: 'files(id, name, modifiedTime, createdTime, owners, lastModifyingUser, webViewLink, parents)'
            });

            const files = response.data.files || [];

            return {
                success: true,
                documentsCount: files.length,
                documents: files.map(file => ({
                    id: file.id,
                    name: file.name,
                    modifiedTime: file.modifiedTime,
                    createdTime: file.createdTime,
                    owners: file.owners,
                    lastModifyingUser: file.lastModifyingUser,
                    documentUrl: file.webViewLink,
                    parents: file.parents
                }))
            };
        } catch (err: any) {
            return `Failed to search documents: ${err.message}`;
        }
    }
}

export class GoogleDocsShareDocument extends StructuredTool {
    name = "google_docs_share_document";
    description = "Share a Google Doc with specific users or change sharing permissions";
    private drive;

    schema = z.object({
        documentId: z.string().describe("The ID of the Google Doc to share"),
        email: z.string().describe("Email address of the person to share with"),
        role: z.enum(['reader', 'writer', 'commenter']).describe("Permission level for the user"),
        sendNotificationEmail: z.boolean().optional().default(true).describe("Whether to send a notification email"),
        emailMessage: z.string().optional().describe("Optional message to include in the notification email")
    });

    constructor(private accessToken: string) {
        super();
        this.drive = getDriveClient(this.accessToken);
    }

    async _call({ documentId, email, role, sendNotificationEmail, emailMessage }: z.infer<typeof this.schema>) {
        try {
            const permission = {
                type: 'user',
                role: role,
                emailAddress: email
            };

            const response = await this.drive.permissions.create({
                fileId: documentId,
                requestBody: permission,
                sendNotificationEmail: sendNotificationEmail,
                emailMessage: emailMessage,
                fields: 'id, emailAddress, role'
            });

            return {
                success: true,
                documentId: documentId,
                permission: {
                    id: response.data.id,
                    email: email,
                    role: role
                },
                documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
            };
        } catch (err: any) {
            return `Failed to share document: ${err.message}`;
        }
    }
}

export class GoogleDocsDeleteDocument extends StructuredTool {
    name = "google_docs_delete_document";
    description = "Delete a Google Doc. This moves it to trash (can be recovered within 30 days).";
    private drive;

    schema = z.object({
        documentId: z.string().describe("The ID of the Google Doc to delete"),
        permanent: z.boolean().optional().default(false).describe("If true, permanently deletes the file instead of moving to trash")
    });

    constructor(private accessToken: string) {
        super();
        this.drive = getDriveClient(this.accessToken);
    }

    async _call({ documentId, permanent }: z.infer<typeof this.schema>) {
        try {
            if (permanent) {
                await this.drive.files.delete({
                    fileId: documentId
                });
                return {
                    success: true,
                    message: `Document permanently deleted`,
                    documentId: documentId
                };
            } else {
                await this.drive.files.update({
                    fileId: documentId,
                    requestBody: {
                        trashed: true
                    }
                });
                return {
                    success: true,
                    message: `Document moved to trash (can be recovered within 30 days)`,
                    documentId: documentId
                };
            }
        } catch (err: any) {
            return `Failed to delete document: ${err.message}`;
        }
    }
}