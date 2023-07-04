export const convertToURLStyleString = ( str: string ): string => {
    const lowerCaseStr = str.toLowerCase();
    const strParts = lowerCaseStr.split( ' ' );

    return strParts.join( '-' );
};