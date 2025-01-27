/**
Returns the list of voices that are available for use when requesting speech synthesis.
Each voice speaks a specified language, is either male or female, and is identified by an ID, which is the ASCII version of the voice name.

When synthesizing speech ( SynthesizeSpeech ), you provide the voice ID for the voice you want from the list of voices returned by DescribeVoices.

For example, you want your news reader application to read news in a specific language, but giving a user the option to choose the voice.
Using the DescribeVoices operation you can provide the user with a list of available voices to select from.

You can optionally specify a language code to filter the available voices.
For example, if you specify en-US, the operation returns a list of all available US English voices.

This operation requires permissions to perform the polly:DescribeVoices action.

@param {string} Engine Specifies the engine ( standard or neural) used by Amazon Polly when processing input text for speech synthesis.
@param {string} LanguageCode The language identification tag (ISO 639 code for the language name-ISO 3166 country code) for filtering the list of voices returned.
If you don’t specify this optional parameter, all available voices are returned.
@param {boolean} IncludeAdditionalLanguageCodes Boolean value indicating whether to return any bilingual voices that use the specified language as an additional language.
For instance, if you request all languages that use US English (es-US),
and there is an Italian voice that speaks both Italian (it-IT) and US English,
that voice will be included if you specify yes but not if you specify no.
@param {dict} auth_headers your application's authorization headers used when making Twitch API requests
@returns {Promise<Array>} An array of dicts with the following properties:

Gender (string) – Gender of the voice.

Id (string) – Amazon Polly assigned voice ID.
This is the ID that you specify when calling the SynthesizeSpeech operation.

LanguageCode (string) – Language code of the voice.

LanguageName (string) – Human readable name of the language in English.

Name (string) – Name of the voice (for example, Salli, Kendra, etc.).
This provides a human readable voice name that you might display in your application.

AdditionalLanguageCodes (list) – Additional codes for languages available for the specified voice in addition to its default language.
For example, the default language for Aditi is Indian English (en-IN) because it was first used for that language.
Since Aditi is bilingual and fluent in both Indian English and Hindi, this parameter would show the code hi-IN.

SupportedEngines (list) – Specifies which engines ( standard or neural) that are supported by a given voice.
*/
export function DescribeVoices(
    auth_headers,
    Engine='standard',
    LanguageCode='',
    IncludeAdditionalLanguageCodes=true){
        const url=new URL('/v1/voices',import.meta.url)
        url.search=new URLSearchParams({
            Engine:Engine,
            LanguageCode:LanguageCode,
            IncludeAdditionalLanguageCodes:IncludeAdditionalLanguageCodes
        })
        return fetch(url,{headers:auth_headers})
        .then(response=>response.json())
        .then(json=>json.Voices)
}

function debug_log(message){
    console.debug('synthesize_speech():',message)
}
/**
Synthesizes UTF-8 input, plain text or SSML, to a stream of bytes.
SSML input must be valid, well-formed SSML.
Some alphabets might not be available with all the voices (for example, Cyrillic might not be read at all by English voices) unless phoneme mapping is used.
@param {String} Text 
Input text to synthesize. If you specify ssml as the TextType, follow the SSML format for the input text.

Type: String

Required: Yes
@param {String} VoiceId 
Voice ID to use for the synthesis. You can get a list of available voice IDs by calling the DescribeVoices operation.

Type: String

Required: Yes
@param {String} TextType 
Specifies whether the input text is plain text or SSML. The default value is plain text.

Type: String

Valid Values: ssml | text

Required: No
@param {string} Engine 
Specifies the engine (standard or neural) for Amazon Polly to use when processing input text for speech synthesis.

When using NTTS-only voices such as Kevin (en-US), this parameter is required and must be set to neural.
If the engine is not specified, or is set to standard, this will result in an error.

For standard voices, this is not required; the engine parameter defaults to standard.

Type: String

Valid Values: standard | neural

Required: No
@param {string} LanguageCode 
Optional language code for the Synthesize Speech request. 
This is only necessary if using a bilingual voice, such as Aditi, which can be used for either Indian English (en-IN) or Hindi (hi-IN).

If a bilingual voice is used and no language code is specified, Amazon Polly uses the default language of the bilingual voice.
The default language for any voice is the one returned by the DescribeVoices operation for the LanguageCode parameter.
For example, if no language code is specified, Aditi will use Indian English rather than Hindi.

Type: String

Required: No
@param {string} OutputFormat 
The format in which the returned output will be encoded.
For audio stream, this will be mp3, ogg_vorbis, or pcm. For speech marks, this will be json.

When pcm is used, the content returned is audio/pcm in a signed 16-bit, 1 channel (mono), little-endian format.

Type: String

Valid Values: json | mp3 | ogg_vorbis | pcm

Required: No
@param {string} SampleRate 
The audio frequency specified in Hz.

The valid values for mp3 and ogg_vorbis are "8000", "16000", "22050", and "24000". The default value is "24000".

Valid values for pcm are "8000" and "16000".

Type: String

Required: No
@param {dict} auth_headers your application's authorization headers used when making Twitch API requests
@returns {Promise<Response>} see OutputFormat parameter
*/
export function SynthesizeSpeech(
    auth_headers,
    Text,
    VoiceId,
    TextType='text',
    Engine='standard',
    LanguageCode='',
    OutputFormat='mp3',
    SampleRate='24000'){
        console.debug('synthesize_speech():',Text)
        if(TextType=='ssml'){
            const openSpeak=/^< *speak *>/ig
            const closeSpeak=/< *\/ *speak *>$/ig
            if(!openSpeak.test(Text)){
                Text='<speak>'+Text
            }
            if(!closeSpeak.test(Text)){
                Text+='</speak>'
            }
            // /(?<=< *)($1)(?= *>)/ig
            const replacements={
                '<lang xml:lang=':/< *lang *=/ig,
                '<prosody $1=':/< *(volume|rate|pitch|max-duration) *=/ig,
                '</prosody>':/< *\/ *(volume|rate|pitch|max-duration) *>/ig,
                '<say-as interpret-as=':/< *(interpret-as|say-as) *=/ig,
                '</say-as>':/< *\/ *interpret-as *>/ig,
                '<sub alias=':/< *(alias|sub) *=/ig,
                '</sub>':/< *\/ *alias *>/ig,
                '<w role=':/< *role *=/ig,
                '<domain name="news">':/< *news *>/ig,
                '</domain>':/< *\/ *news *>/ig,
                'effect=$1':/(?<=< *)(drc|whispered)(?= *>)/ig,
                '<effect name=':/< *effect *=/ig,
                'effect phonation="soft"':/(?<=< *)(soft)(?= *>)/ig,
                'effect vocal-tract-length':/(?<=< *)(vocal-tract-length)(?= *=)/ig,
                'amazon:$1':/(?<=<.*= *"? *)(VBD|VB|DT|IN|JJ|NN|DEFAULT|SENSE_1)(?=.*>)/ig,
                'amazon:$1':/(?<=<.*)(?<!amazon:)(max-duration|breath|auto-breaths|domain|effect)(?=.*>)/ig,
            }
            for(const key in replacements){
                Text=Text.replaceAll(replacements[key],key)
            }
            console.debug(Text)
        }
        const url=new URL('/v1/speech',import.meta.url)
        url.search=new URLSearchParams({
            Text:Text,
            VoiceId:VoiceId,
            TextType:TextType,
            Engine:Engine,
            LanguageCode:LanguageCode,
            OutputFormat:OutputFormat,
            SampleRate:SampleRate
        })
        return fetch(url,{headers:auth_headers})
    }

export default SynthesizeSpeech

export class Polly {

    /** @type {import('@twurple/auth').AuthProvider} */
    #auth_provider = null;

    /**
     * 
     * @param {import('@twurple/auth').AuthProvider} auth_provider 
     */
    constructor(auth_provider) {
        this.#auth_provider = auth_provider
    }

    async #GetAuthHeaders() {
        const token = await this.#auth_provider.getAccessTokenForUser()
        return {
            'authorization': 'OAuth ' + token.access_token,
            'client-id': this.#auth_provider.client_id
        }
    }

    async DescribeVoices(Engine = 'standard', LanguageCode = '', IncludeAdditionalLanguageCodes = true) {
        return DescribeVoices(await this.#GetAuthHeaders(), Engine, LanguageCode, IncludeAdditionalLanguageCodes)
    }

    async SynthesizeSpeech(
        Text,
        VoiceId,
        TextType = 'text',
        Engine = 'standard',
        LanguageCode = '',
        OutputFormat = 'mp3',
        SampleRate = '24000') {
        return SynthesizeSpeech(
            await this.#GetAuthHeaders(),
            Text,
            VoiceId,
            TextType,
            Engine,
            LanguageCode,
            OutputFormat,
            SampleRate
        )
    }
}