import jsmodule from '../static/twitch-polly.mjs'
import { AwsClient } from 'aws4fetch'

/**
 * create a Response object with control headers set
 * @param {BodyInit} body 
 * @param {ResponseInit} init 
 */
function makeResponse(body=undefined,init=undefined){
	if(!init){
		init={}
	}
	if(!init.headers){
		init.headers={}
	}
	init.headers['access-control-allow-headers']='authorization,client-id'
	init.headers['access-control-allow-origin']='*'
	init.headers['access-control-allow-private-network']='true'
	init.headers['cache-control']='none'
	return new Response(body,init)
}

function awsRequest(accessKeyId,secretAccessKey,host,endpoint,options){
	console.log(host+endpoint+options)
	const aws=new AwsClient({
		accessKeyId:accessKeyId,
		secretAccessKey:secretAccessKey,
	})
	return aws.fetch(host+endpoint+options)
}

export default {
	async fetch(request, env, ctx) {
		if(request.method==='OPTIONS'){
			return makeResponse()
		}
		const url=new URL(request.url)
		if(url.pathname==='/twitch-polly.mjs'){
			return makeResponse(jsmodule,{
				headers:{
					'content-type':'text/javascript'
				}
			})
		}
		const validation=await fetch('https://id.twitch.tv/oauth2/validate',
			{headers:request.headers})
		if(!validation.ok){
			return validation
		}
		if(url.pathname=='/describe_voices'){
			url.pathname='/v1/voices'
		}
		if(url.pathname=='/synthesize_speech'){
			url.pathname='/v1/speech'
		}
		if(url.searchParams.get('LanguageCode')==''){
			url.searchParams.delete('LanguageCode')
		}
		return makeResponse(
			await awsRequest(
				env.AWS_ACCESS_KEY_ID,
				env.AWS_SECRET_ACCESS_KEY,
				env.AWS_HOST,
				url.pathname,
				url.search
			).then(response=>response.blob())
		)
	},
};
