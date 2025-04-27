import { Transaction, Keypair } from "@solana/web3.js";
import bs58 from 'bs58';

const URL = `https://api2.gib.work`;
export async function getTaskById(id: string) {
    try {
        const response = await fetch(`${URL}/tasks/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch task with id ${id}: ${response.statusText}`);
        }
        const task = await response.json();
        return task;
    } catch (error) {
        console.error(`Error fetching task with id ${id}:`, error);
        throw error;
    }
}

export async function getTasks({
    page = 1,
    limit = 15,
    pageAll = false,
    search = '',
    orderBy = '',
    tags = []
}: {
    page?: number;
    limit?: number;
    pageAll?: boolean;
    search?: string;
    orderBy?: string;
    tags?: string[];
} = {}) {
    try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (pageAll) {
            params.append('pageAll', 'true');
        }

        if (search) {
            params.append('search', search);
        }

        if (orderBy) {
            params.append('orderBy', orderBy);
        }

        if (tags.length > 0) {
            tags.forEach(tag => params.append('tags', tag));
        }

        const url = `${URL}/explore?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch explore data: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching explore data:', error);
        throw error;
    }
}


export async function createTask({
    title,
    content,
    requirements,
    tags,
    payer,
    token
}: {
    title: string;
    content: string;
    requirements: string;
    tags: string[];
    payer: string;
    token: object;
}) {
    try {
        const requestData = {
            title,
            content,
            requirements,
            tags,
            payer,
            token
        };

        const url = `${URL}/tasks/public/transaction`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create task transaction: ${response.statusText}`);
        }

        const responseData = await response.json();
        if (!responseData.taskId && !responseData.serializedTransaction) {
            throw new Error(`${responseData.message || 'Failed to create task'}`);
        }

        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Solana private key not found in environment variables');
        }

        const signedTransaction = await signTransaction(responseData, privateKey);

        return {
            status: "success",
            taskId: responseData.taskId,
            signature: signedTransaction
        };
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}

async function signTransaction(transactionData: any, privateKey: string) {
    const serializedTransaction = Buffer.from(
        transactionData.serializedTransaction,
        "base64"
    );
    const transaction = Transaction.from(serializedTransaction);
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    transaction.sign(keypair);
    return transaction.serialize();
}