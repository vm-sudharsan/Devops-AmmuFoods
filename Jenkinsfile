pipeline {
agent any

environment {
    DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
}

stages {

    stage('Verify Tools') {
        steps {
            bat 'git --version'
            bat 'docker --version'
        }
    }

    stage('Build Backend Image') {
        steps {
            dir('backend') {
                bat 'docker build -t ammu-backend:latest .'
            }
        }
    }

    stage('Build Frontend Image') {
        steps {
            dir('frontend') {
                bat 'docker build -t ammu-frontend:latest .'
            }
        }
    }

    stage('Tag Images') {
        steps {
            bat 'docker tag ammu-backend:latest %DOCKERHUB_USERNAME%/ammufoods-backend:latest'
            bat 'docker tag ammu-frontend:latest %DOCKERHUB_USERNAME%/ammufoods-frontend:latest'
        }
    }

    // new docker login 
    stage('Docker Hub Login') {
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'dockerhub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )
        ]) {

            writeFile file: 'docker_token.txt', text: env.DOCKER_PASS

            bat '''
                type docker_token.txt | docker login -u %DOCKER_USER% --password-stdin
            '''
        }
    }
}
    // stage('Docker Hub Login') {
    //     steps {
    //         withCredentials([
    //             usernamePassword(
    //                 credentialsId: 'dockerhub-creds',
    //                 usernameVariable: 'DOCKER_USER',
    //                 passwordVariable: 'DOCKER_PASS'
    //             )
    //         ]) {
    //                 bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
    //         }
    //     }
    // }

    stage('Push Backend Image') {
        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )
            ]) {
                bat 'docker push %DOCKER_USER%/ammufoods-backend:latest'
            }
        }
    }

    stage('Push Frontend Image') {
        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )
            ]) {
                bat 'docker push %DOCKER_USER%/ammufoods-frontend:latest'
            }
        }
    }

    // Stage 1 testing of Jenkins Workflow
    // stage('Verify Git') {
    //     steps {
    //         bat 'git --version'
    //     }
    // }

    // stage('Verify Docker') {
    //     steps {
    //         bat 'docker --version'
    //     }

    // }

}

}
