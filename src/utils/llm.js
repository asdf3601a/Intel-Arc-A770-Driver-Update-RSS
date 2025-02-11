export async function llm(
    token = '',
    account = '',
    messages = {},
    model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`
    const res = await (await fetch(
        url,
        {
            headers: { Authorization: `Bearer ${token}` },
            method: 'POST',
            body: JSON.stringify(messages)
        }
    )).json()

    console.log(JSON.stringify(res))

    return res
}
