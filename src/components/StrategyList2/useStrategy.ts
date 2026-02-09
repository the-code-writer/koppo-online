import strategyApi from '../../services/apiStategiesService';
import { Strategy } from '../../types/strategy';

export const getStrategies = async () => {

    const result = await strategyApi.getStrategies();

    if(result.success){
      return result?.data?.strategies;
    }

}

export const getFreeBots = async () => {

    return [];

}

export const getPremiumBots = async () => {

    return [];

}

export const getMyBots = async () => {

    return [];

}

export const useStrategy = {

getStrategies,
getFreeBots,
getPremiumBots,
getMyBots

}